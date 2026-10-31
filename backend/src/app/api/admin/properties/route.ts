import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllProperties,
  getPropertyById,
  approvePropertyRecord,
  rejectPropertyRecord,
  togglePropertyPauseRecord,
  togglePropertyFeaturedRecord,
  togglePropertyHandpickedRecord,
  updatePropertyLocationHierarchy,
  deletePropertyRecord,
  createPropertyRecord,
  updatePropertyRecord,
} from "../../../../lib/storage/propertyStore";
import { validateHierarchy } from "../../../../lib/storage/destinationStore";
import { addHandpickedItem, removeHandpickedItem } from "../../../../lib/storage/handpickedStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";
import { getAllOwners } from "../../../../lib/storage/propertyOwnerStore";
import { Property, PropertyImage, PropertyTypeCategory } from "../../../../types/property";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const propertyType = searchParams.get("propertyType");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const ownerId = searchParams.get("ownerId");

    let properties = getAllProperties();
    const owners = getAllOwners();
    const ownerMap = new Map(owners.map((o) => [o.id, o.fullName]));

    if (status && status !== "all") {
      properties = properties.filter((p) => p.status === status);
    }

    if (propertyType && propertyType !== "all") {
      properties = properties.filter((p) => p.propertyType === propertyType);
    }

    if (ownerId) {
      properties = properties.filter((p) => p.ownerId === ownerId);
    }

    if (search) {
      properties = properties.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.location.city.toLowerCase().includes(search) ||
          p.location.state.toLowerCase().includes(search) ||
          p.location.locality.toLowerCase().includes(search) ||
          (ownerMap.get(p.ownerId) || "").toLowerCase().includes(search)
      );
    }

    // Attach owner names to the properties
    const enriched = properties.map((p) => ({
      ...p,
      ownerName: p.createdByRole === "admin" && (!p.ownerId || p.ownerId.startsWith("admin_") || p.ownerId === "admin")
        ? "Admin Managed"
        : (ownerMap.get(p.ownerId) || (p.createdByRole === "admin" ? "Admin Managed" : "Independent Owner")),
    }));

    return NextResponse.json({
      success: true,
      properties: enriched,
      total: enriched.length,
    });
  } catch (error) {
    console.error("Admin Properties GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (
      !checkAdminPermission(admin, "properties.create") &&
      !checkAdminPermission(admin, "properties.update") &&
      !checkAdminPermission(admin, "properties.approve")
    ) {
      return NextResponse.json({ success: false, message: "Forbidden: Insufficient permissions to create properties" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      propertyType,
      shortDescription,
      detailedDescription,
      countryId,
      stateId,
      cityId,
      areaId,
      locality,
      address,
      postalCode,
      pricePerNight,
      originalPrice,
      maxGuests,
      bedrooms,
      bathrooms,
      checkInTime,
      checkOutTime,
      amenities,
      images,
      contactPerson,
      mobileNumber,
      email,
      altPhone,
      status,
      featured,
      handpicked,
      ownerId,
      coordinates,
      latitude,
      longitude,
    } = body;

    // 1. Basic validation
    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json({ success: false, message: "Property name is required and must be at least 3 characters." }, { status: 400 });
    }

    if (!propertyType || typeof propertyType !== "string") {
      return NextResponse.json({ success: false, message: "Valid property type category is required." }, { status: 400 });
    }

    if (!countryId || !stateId || !cityId) {
      return NextResponse.json({ success: false, message: "Complete destination hierarchy (countryId, stateId, cityId) is required." }, { status: 400 });
    }

    if (!address || typeof address !== "string" || !address.trim()) {
      return NextResponse.json({ success: false, message: "Street address is required." }, { status: 400 });
    }

    const price = Number(pricePerNight);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ success: false, message: "Valid price per night greater than 0 is required." }, { status: 400 });
    }

    // 2. Strict Server-Side Hierarchy Integrity Validation
    const hierarchyResult = validateHierarchy(countryId, stateId, cityId, areaId);
    if (!hierarchyResult.isValid) {
      return NextResponse.json({ success: false, message: hierarchyResult.error }, { status: 400 });
    }

    const canonicalCountry = hierarchyResult.country!;
    const canonicalState = hierarchyResult.state!;
    const canonicalCity = hierarchyResult.city!;
    const canonicalArea = hierarchyResult.area;

    // 3. Format and sanitize images
    let formattedImages: PropertyImage[] = [];
    if (Array.isArray(images) && images.length > 0) {
      formattedImages = images
        .map((img: any, idx: number) => {
          if (typeof img === "string" && img.trim()) {
            return {
              id: `img_${Date.now()}_${idx}`,
              url: img.trim(),
              isCover: idx === 0,
            };
          }
          if (img && typeof img.url === "string" && img.url.trim()) {
            return {
              id: img.id || `img_${Date.now()}_${idx}`,
              url: img.url.trim(),
              isCover: img.isCover !== undefined ? Boolean(img.isCover) : idx === 0,
              caption: img.caption?.trim(),
            };
          }
          return null;
        })
        .filter((img): img is PropertyImage => img !== null);
    }

    if (formattedImages.length === 0) {
      formattedImages = [
        {
          id: `img_${Date.now()}_0`,
          url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
          isCover: true,
          caption: name.trim(),
        },
      ];
    } else {
      // Ensure at least one cover image is designated
      if (!formattedImages.some((img) => img.isCover)) {
        formattedImages[0].isCover = true;
      }
    }

    // 4. Construct complete Property model
    const now = new Date().toISOString();
    const propertyRecordId = `prop_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const initialStatus = status || "approved";

    const resolvedLat = coordinates?.latitude ?? coordinates?.lat ?? latitude;
    const resolvedLng = coordinates?.longitude ?? coordinates?.lng ?? longitude;
    const finalCoordinates = (resolvedLat !== undefined && resolvedLng !== undefined && !isNaN(Number(resolvedLat)) && !isNaN(Number(resolvedLng)))
      ? {
          latitude: Number(resolvedLat),
          longitude: Number(resolvedLng),
          lat: Number(resolvedLat),
          lng: Number(resolvedLng),
        }
      : undefined;

    const newProperty: Property = {
      id: propertyRecordId,
      ownerId: ownerId || admin.id,
      createdByRole: "admin",
      createdById: admin.id,
      name: name.trim(),
      propertyType: propertyType as PropertyTypeCategory,
      shortDescription: (shortDescription && typeof shortDescription === "string" ? shortDescription.trim() : "") || `Stunning luxury stay in ${canonicalCity.name}, ${canonicalState.name}.`,
      detailedDescription: (detailedDescription && typeof detailedDescription === "string" ? detailedDescription.trim() : "") || `Experience unmatched luxury, premium hospitality, and comfort at ${name.trim()} in ${canonicalCity.name}.`,
      countryId: canonicalCountry.id,
      stateId: canonicalState.id,
      cityId: canonicalCity.id,
      areaId: canonicalArea?.id,
      location: {
        country: canonicalCountry.name,
        state: canonicalState.name,
        city: canonicalCity.name,
        locality: (locality && typeof locality === "string" && locality.trim()) || canonicalArea?.name || canonicalCity.name,
        address: address.trim(),
        postalCode: (postalCode && typeof postalCode === "string" && postalCode.trim()) || canonicalArea?.postalCode || "000000",
        countryId: canonicalCountry.id,
        stateId: canonicalState.id,
        cityId: canonicalCity.id,
        areaId: canonicalArea?.id,
        coordinates: finalCoordinates,
      },
      images: formattedImages,
      pricing: {
        pricePerNight: price,
        currency: "INR",
        originalPrice: originalPrice ? Number(originalPrice) : undefined,
      },
      capacity: {
        maxGuests: Number(maxGuests) || 2,
        bedrooms: Number(bedrooms) || 1,
        bathrooms: Number(bathrooms) || 1,
        checkInTime: checkInTime || "14:00",
        checkOutTime: checkOutTime || "11:00",
      },
      amenities: Array.isArray(amenities) ? amenities.filter((a) => typeof a === "string" && a.trim()) : [
        "Swimming Pool",
        "High-Speed Wi-Fi",
        "Air Conditioning",
        "Free Valet Parking",
        "Daily Housekeeping",
      ],
      contactDetails: {
        contactPerson: (contactPerson && typeof contactPerson === "string" ? contactPerson.trim() : "") || admin.fullName,
        mobileNumber: (mobileNumber && typeof mobileNumber === "string" ? mobileNumber.trim() : "") || "9876543210",
        email: (email && typeof email === "string" ? email.trim() : "") || admin.email,
        altPhone: altPhone ? String(altPhone).trim() : undefined,
      },
      status: initialStatus,
      featured: Boolean(featured),
      handpicked: Boolean(handpicked),
      rating: 4.8,
      reviewCount: 0,
      approvedAt: initialStatus === "approved" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    // 5. Persist to storage
    createPropertyRecord(newProperty);

    // 6. Record audit log
    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "properties_management",
      action: "admin_create_property",
      resourceId: newProperty.id,
      resourceType: "property",
      details: `Created new property "${newProperty.name}" (${newProperty.propertyType}) under ${canonicalCity.name}, ${canonicalState.name}, ${canonicalCountry.name}`,
      status: "success",
    });

    return NextResponse.json(
      {
        success: true,
        message: `Property "${newProperty.name}" created successfully in ${canonicalCity.name}, ${canonicalState.name}.`,
        property: newProperty,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Properties POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create property" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, rejectionReason, hierarchy } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "Property id and action are required" }, { status: 400 });
    }

    const prop = getPropertyById(id);
    if (!prop) {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 404 });
    }

    let updated = null;

    if (action === "approve") {
      if (!checkAdminPermission(admin, "properties.approve")) {
        return NextResponse.json({ success: false, message: "Permission denied for approval" }, { status: 403 });
      }
      updated = approvePropertyRecord(id);
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "properties_management",
        action: "approve_property",
        resourceId: id,
        resourceType: "property",
        details: `Approved property "${prop.name}" (Status changed to published)`,
        status: "success",
      });
    } else if (action === "reject") {
      if (!checkAdminPermission(admin, "properties.reject")) {
        return NextResponse.json({ success: false, message: "Permission denied for rejection" }, { status: 403 });
      }
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({ success: false, message: "A specific rejection reason is mandatory" }, { status: 400 });
      }
      updated = rejectPropertyRecord(id, rejectionReason);
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "properties_management",
        action: "reject_property",
        resourceId: id,
        resourceType: "property",
        details: `Rejected property "${prop.name}". Reason: ${rejectionReason}`,
        status: "success",
      });
    } else if (action === "toggle_pause") {
      if (!checkAdminPermission(admin, "properties.update")) {
        return NextResponse.json({ success: false, message: "Permission denied to pause/publish" }, { status: 403 });
      }
      updated = togglePropertyPauseRecord(id);
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "properties_management",
        action: "toggle_pause_property",
        resourceId: id,
        resourceType: "property",
        details: `Toggled pause status for property "${prop.name}" to ${updated?.status}`,
        status: "success",
      });
    } else if (action === "toggle_featured") {
      if (!checkAdminPermission(admin, "properties.update")) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 });
      }
      updated = togglePropertyFeaturedRecord(id);
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "properties_management",
        action: "toggle_featured",
        resourceId: id,
        resourceType: "property",
        details: `Toggled featured status for "${prop.name}" to ${updated?.featured}`,
        status: "success",
      });
    } else if (action === "toggle_handpicked") {
      if (!checkAdminPermission(admin, "properties.update")) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 });
      }
      updated = togglePropertyHandpickedRecord(id);
      if (updated?.handpicked) {
        addHandpickedItem({ propertyId: id });
      } else {
        removeHandpickedItem(id);
      }
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "properties_management",
        action: "toggle_handpicked",
        resourceId: id,
        resourceType: "property",
        details: `Toggled handpicked status for "${prop.name}" to ${updated?.handpicked}`,
        status: "success",
      });
    } else if (action === "update_hierarchy") {
      if (!checkAdminPermission(admin, "properties.update")) {
        return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 });
      }
      if (!hierarchy) {
        return NextResponse.json({ success: false, message: "Hierarchy data required" }, { status: 400 });
      }
      updated = updatePropertyLocationHierarchy(id, hierarchy);
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "properties_management",
        action: "update_hierarchy",
        resourceId: id,
        resourceType: "property",
        details: `Updated destination hierarchy for "${prop.name}"`,
        status: "success",
      });
    } else if (action === "edit_details") {
      if (!checkAdminPermission(admin, "properties.update")) {
        return NextResponse.json({ success: false, message: "Permission denied to edit property" }, { status: 403 });
      }

      const updates: Partial<Property> = {};
      if (body.name && typeof body.name === "string" && body.name.trim().length >= 3) {
        updates.name = body.name.trim();
      }
      if (body.propertyType) {
        updates.propertyType = body.propertyType;
      }
      if (body.shortDescription !== undefined) {
        updates.shortDescription = String(body.shortDescription).trim();
      }
      if (body.detailedDescription !== undefined) {
        updates.detailedDescription = String(body.detailedDescription).trim();
      }
      if (body.pricePerNight && Number(body.pricePerNight) > 0) {
        updates.pricing = {
          pricePerNight: Number(body.pricePerNight),
          currency: "INR",
          originalPrice: body.originalPrice ? Number(body.originalPrice) : prop.pricing.originalPrice,
        };
      }
      if (body.maxGuests || body.bedrooms || body.bathrooms) {
        updates.capacity = {
          maxGuests: body.maxGuests ? Number(body.maxGuests) : prop.capacity.maxGuests,
          bedrooms: body.bedrooms ? Number(body.bedrooms) : prop.capacity.bedrooms,
          bathrooms: body.bathrooms ? Number(body.bathrooms) : prop.capacity.bathrooms,
          checkInTime: body.checkInTime || prop.capacity.checkInTime,
          checkOutTime: body.checkOutTime || prop.capacity.checkOutTime,
        };
      }
      if (Array.isArray(body.amenities)) {
        updates.amenities = body.amenities;
      }
      if (Array.isArray(body.images) && body.images.length > 0) {
        updates.images = body.images.map((img: any, idx: number) => {
          if (typeof img === "string") {
            return { id: `img_${Date.now()}_${idx}`, url: img, isCover: idx === 0 };
          }
          return {
            id: img.id || `img_${Date.now()}_${idx}`,
            url: img.url,
            isCover: img.isCover !== undefined ? Boolean(img.isCover) : idx === 0,
            caption: img.caption,
          };
        });
      }
      if (body.contactDetails) {
        updates.contactDetails = {
          ...prop.contactDetails,
          ...body.contactDetails,
        };
      }
      if (body.status) {
        updates.status = body.status;
      }
      if (body.featured !== undefined) {
        updates.featured = Boolean(body.featured);
      }

      // Hierarchy validation if destination was changed
      if (body.countryId || body.stateId || body.cityId) {
        const cId = body.countryId || prop.countryId || prop.location.countryId || "";
        const sId = body.stateId || prop.stateId || prop.location.stateId || "";
        const ctId = body.cityId || prop.cityId || prop.location.cityId || "";
        const aId = body.areaId || prop.areaId || prop.location.areaId;

        const hier = validateHierarchy(cId, sId, ctId, aId);
        if (!hier.isValid) {
          return NextResponse.json({ success: false, message: hier.error }, { status: 400 });
        }

        updates.countryId = hier.country!.id;
        updates.stateId = hier.state!.id;
        updates.cityId = hier.city!.id;
        updates.areaId = hier.area?.id;
        updates.location = {
          ...prop.location,
          country: hier.country!.name,
          state: hier.state!.name,
          city: hier.city!.name,
          locality: (body.locality && String(body.locality).trim()) || hier.area?.name || prop.location.locality,
          address: (body.address && String(body.address).trim()) || prop.location.address,
          postalCode: (body.postalCode && String(body.postalCode).trim()) || hier.area?.postalCode || prop.location.postalCode,
          countryId: hier.country!.id,
          stateId: hier.state!.id,
          cityId: hier.city!.id,
          areaId: hier.area?.id,
        };
      } else if (body.address || body.locality || body.postalCode) {
        updates.location = {
          ...prop.location,
          ...(body.address ? { address: String(body.address).trim() } : {}),
          ...(body.locality ? { locality: String(body.locality).trim() } : {}),
          ...(body.postalCode ? { postalCode: String(body.postalCode).trim() } : {}),
        };
      }

      updated = updatePropertyRecord(id, updates);
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "properties_management",
        action: "edit_property_details",
        resourceId: id,
        resourceType: "property",
        details: `Updated property information for "${prop.name}"`,
        status: "success",
      });
    } else {
      return NextResponse.json({ success: false, message: `Unknown action "${action}"` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Property action "${action}" completed successfully`,
      property: updated,
    });
  } catch (error) {
    console.error("Admin Properties PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "properties.delete")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Property ID required" }, { status: 400 });
    }

    const prop = getPropertyById(id);
    const success = deletePropertyRecord(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Property not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "properties_management",
      action: "delete_property",
      resourceId: id,
      resourceType: "property",
      details: `Permanently deleted property "${prop?.name || id}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Property deleted successfully" });
  } catch (error) {
    console.error("Admin Properties DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete property" }, { status: 500 });
  }
}
