import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllOwners,
  updateOwnerStatus,
  deleteOwner,
  findOwnerByEmail,
  findOwnerByMobile,
  createOwner,
  sanitizeOwner,
  updateOwnerProfile,
} from "../../../../lib/storage/propertyOwnerStore";
import { hashPassword } from "../../../../lib/security/passwordHasher";
import { PropertyOwnerRecord } from "../../../../types/auth";
import { getPropertiesByOwnerId } from "../../../../lib/storage/propertyStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("query") || searchParams.get("search") || "").trim().toLowerCase();

    let owners = await getAllOwners();
    if (query) {
      owners = owners.filter((o) => {
        const ownerNum = (o.ownerNumber || "").toLowerCase();
        return (
          ownerNum.includes(query) ||
          (o.fullName || "").toLowerCase().includes(query) ||
          (o.email || "").toLowerCase().includes(query) ||
          (o.mobileNumber || "").toLowerCase().includes(query) ||
          (o.businessName || "").toLowerCase().includes(query)
        );
      });
    }

    const enriched = owners.map((owner) => {
      const properties = getPropertiesByOwnerId(owner.id);
      return {
        id: owner.id,
        ownerNumber: owner.ownerNumber || null,
        fullName: owner.fullName,
        email: owner.email,
        mobileNumber: owner.mobileNumber,
        businessName: owner.businessName,
        status: owner.status,
        avatar: owner.avatar || owner.profileImage || undefined,
        profileImage: owner.profileImage || owner.avatar || null,
        languagesSpoken: owner.languagesSpoken || [],
        aboutOwner: owner.aboutOwner || owner.bio || "",
        address: owner.address || "",
        altPhone: owner.altPhone || "",
        propertiesCount: properties.length,
        publishedCount: properties.filter((p) => p.status === "approved").length,
        properties: properties.map((p) => ({
          id: p.id,
          propertyNumber: p.propertyNumber,
          name: p.name,
          propertyType: p.propertyType,
          status: p.status,
          pricePerNight: p.pricing?.pricePerNight,
          location: p.location ? `${p.location.city || ""}, ${p.location.state || ""}`.replace(/^,\s*|,\s*$/g, "") : "",
        })),
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt,
      };
    });

    return NextResponse.json({ success: true, owners: enriched });
  } catch (error) {
    console.error("Admin Owners GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch owners" }, { status: 500 });
  }
}

function generateSecureTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `Hex#${randomCode}!${crypto.randomInt(10, 99)}`;
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "owners.create")) {
      return NextResponse.json({ success: false, message: "Forbidden: Insufficient privileges" }, { status: 403 });
    }

    const body = await req.json();
    const {
      fullName,
      email,
      mobileNumber,
      password,
      businessName,
      status,
      address,
      profileImage,
      avatar,
      languagesSpoken,
      aboutOwner,
      bio,
      altPhone,
    } = body;

    if (!fullName?.trim() || !email?.trim() || !mobileNumber?.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name, email address, and mobile number are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, message: "Invalid email address format" }, { status: 400 });
    }

    if (await findOwnerByEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "An owner with this email address already exists" },
        { status: 409 }
      );
    }

    const normalizedMobile = mobileNumber.replace(/\D/g, "");
    if (normalizedMobile.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (await findOwnerByMobile(normalizedMobile)) {
      return NextResponse.json(
        { success: false, message: "An owner with this mobile number already exists" },
        { status: 409 }
      );
    }

    const cleanAbout = (aboutOwner ?? bio ?? "").trim();
    if (cleanAbout.length > 2000) {
      return NextResponse.json(
        { success: false, message: "About the owner cannot exceed 2,000 characters" },
        { status: 400 }
      );
    }

    const cleanLangs = Array.isArray(languagesSpoken)
      ? Array.from(new Set(languagesSpoken.map((l: unknown) => String(l).trim()).filter(Boolean)))
      : [];

    const effectiveProfileImage = profileImage ?? avatar ?? null;

    const isAutoPassword = !password?.trim();
    const effectivePassword = isAutoPassword ? generateSecureTempPassword() : password.trim();
    const { hash, salt } = hashPassword(effectivePassword);
    const now = new Date().toISOString();

    const newOwner: PropertyOwnerRecord = {
      id: `owner_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobileNumber: mobileNumber.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      role: "property_owner",
      status: status || "active",
      businessName: businessName?.trim() || "",
      address: address?.trim() || "",
      profileImage: effectiveProfileImage,
      avatar: effectiveProfileImage || undefined,
      languagesSpoken: cleanLangs,
      aboutOwner: cleanAbout,
      bio: cleanAbout,
      altPhone: altPhone?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    let createdRecord = newOwner;
    try {
      createdRecord = await createOwner(newOwner);
    } catch (error) {
      const mongoError = error as {
        code?: number;
        keyPattern?: Record<string, unknown>;
        keyValue?: Record<string, unknown>;
      };
      if (mongoError.code === 11000) {
        const duplicateEmail = mongoError.keyPattern?.emailNormalized || mongoError.keyValue?.emailNormalized;
        const duplicateMobile = mongoError.keyPattern?.mobileNormalized || mongoError.keyValue?.mobileNormalized;
        return NextResponse.json(
          {
            success: false,
            message: duplicateEmail
              ? "An owner with this email address already exists"
              : duplicateMobile
                ? "An owner with this mobile number already exists"
                : "An owner with these details already exists",
          },
          { status: 409 }
        );
      }
      throw error;
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "owners_and_users",
      action: "create_owner",
      resourceId: newOwner.id,
      resourceType: "owner",
      details: `Admin created owner "${newOwner.fullName}" (${newOwner.email}) with status "${newOwner.status}"`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      owner: sanitizeOwner(createdRecord),
      tempPassword: isAutoPassword ? effectivePassword : undefined,
      message: "Property owner successfully created!",
    });
  } catch (error) {
    console.error("Admin Owners POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create owner" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "owners.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      status,
      fullName,
      email,
      mobileNumber,
      businessName,
      address,
      profileImage,
      avatar,
      languagesSpoken,
      aboutOwner,
      bio,
      altPhone,
      password,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Owner id required" }, { status: 400 });
    }

    const keys = Object.keys(body);
    if (keys.length === 2 && keys.includes("id") && keys.includes("status")) {
      const updated = await updateOwnerStatus(id, status);
      if (!updated) {
        return NextResponse.json({ success: false, message: "Owner not found" }, { status: 404 });
      }

      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "owners_and_users",
        action: "update_owner_status",
        resourceId: id,
        resourceType: "owner",
        details: `Updated owner "${updated.fullName}" status to "${status}"`,
        status: "success",
      });

      return NextResponse.json({ success: true, owner: updated });
    }

    const updates: Partial<PropertyOwnerRecord> = {};
    if (fullName !== undefined) updates.fullName = fullName.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (mobileNumber !== undefined) updates.mobileNumber = mobileNumber.trim();
    if (businessName !== undefined) updates.businessName = businessName.trim();
    if (address !== undefined) updates.address = address.trim();
    if (altPhone !== undefined) updates.altPhone = altPhone.trim();
    if (status !== undefined) updates.status = status;

    if (profileImage !== undefined || avatar !== undefined) {
      const img = profileImage ?? avatar ?? null;
      updates.profileImage = img;
      updates.avatar = img || "";
    }

    if (languagesSpoken !== undefined) {
      updates.languagesSpoken = Array.isArray(languagesSpoken)
        ? Array.from(new Set(languagesSpoken.map((l: unknown) => String(l).trim()).filter(Boolean)))
        : [];
    }

    if (aboutOwner !== undefined || bio !== undefined) {
      const text = (aboutOwner ?? bio ?? "").trim();
      if (text.length > 2000) {
        return NextResponse.json(
          { success: false, message: "About the owner cannot exceed 2,000 characters." },
          { status: 400 }
        );
      }
      updates.aboutOwner = text;
      updates.bio = text;
    }

    if (password && password.trim()) {
      const { hash, salt } = hashPassword(password.trim());
      updates.passwordHash = hash;
      updates.passwordSalt = salt;
    }

    const updated = await updateOwnerProfile(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Owner not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "owners_and_users",
      action: "update_owner_profile",
      resourceId: id,
      resourceType: "owner",
      details: `Updated profile details for owner "${updated.fullName}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, owner: updated });
  } catch (error) {
    console.error("Admin Owners PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update owner" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "owners.suspend")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Owner id required" }, { status: 400 });
    }

    const success = await deleteOwner(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Owner not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "owners_and_users",
      action: "delete_owner",
      resourceId: id,
      resourceType: "owner",
      details: `Deleted owner record ${id}`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Owner deleted successfully" });
  } catch (error) {
    console.error("Admin Owners DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete owner" }, { status: 500 });
  }
}
