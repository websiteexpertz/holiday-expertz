import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../../lib/security/adminAuthService";
import {
  getAllDestinationHeroImages,
  getDestinationHeroImages,
  createDestinationHeroImage,
  updateDestinationHeroImage,
  deleteDestinationHeroImage,
  reorderDestinationHeroImages,
  getDestinationHeroImageById,
} from "../../../../../lib/storage/destinationHeroImageStore";
import { recordAuditLog } from "../../../../../lib/storage/auditLogStore";

export async function GET(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!checkAdminPermission(admin, "destinations.view")) {
      return NextResponse.json({ success: false, message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get("countryId") || undefined;
    const stateId = searchParams.get("stateId") || undefined;
    const all = searchParams.get("all") === "true";

    let images = getAllDestinationHeroImages();

    if (!all && (countryId || stateId)) {
      if (stateId) {
        images = images.filter((img) => img.destinationType === "state" && img.stateId === stateId);
      } else if (countryId) {
        images = images.filter((img) => img.destinationType === "country" && img.countryId === countryId);
      }
    }

    images.sort((a, b) => a.order - b.order);

    return NextResponse.json({ success: true, images, total: images.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!checkAdminPermission(admin, "destinations.create") && !checkAdminPermission(admin, "destinations.update")) {
      return NextResponse.json({ success: false, message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const { destinationType, countryId, stateId, title, locationName, imageUrl, altText, order, isActive } = body;

    if (!destinationType || !countryId || !title || !imageUrl) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: destinationType, countryId, title, imageUrl." },
        { status: 400 }
      );
    }

    if (destinationType === "state" && !stateId) {
      return NextResponse.json(
        { success: false, message: "stateId is required when destinationType is 'state'." },
        { status: 400 }
      );
    }

    const created = createDestinationHeroImage({
      destinationType,
      countryId,
      stateId: destinationType === "state" ? stateId : undefined,
      title: title.trim(),
      locationName: locationName ? locationName.trim() : "",
      imageUrl: imageUrl.trim(),
      altText: altText ? altText.trim() : title.trim(),
      order: typeof order === "number" ? order : 0,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "destinations",
      action: "destination_hero_image.create",
      resourceId: created.id,
      resourceType: "DestinationHeroImage",
      details: `Created hero image '${created.title}' for ${destinationType} ${destinationType === "state" ? stateId : countryId}`,
      after: created,
      status: "success",
    });

    return NextResponse.json({ success: true, image: created });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to create hero image" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!checkAdminPermission(admin, "destinations.update")) {
      return NextResponse.json({ success: false, message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();

    // Check if reordering batch
    if (Array.isArray(body.orderedIds)) {
      const updated = reorderDestinationHeroImages(body.orderedIds);
      return NextResponse.json({ success: true, images: updated });
    }

    const { id, updates } = body;
    if (!id || !updates) {
      return NextResponse.json({ success: false, message: "Image ID and updates are required." }, { status: 400 });
    }

    const existing = getDestinationHeroImageById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Image not found." }, { status: 404 });
    }

    const updated = updateDestinationHeroImage(id, updates);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "destinations",
      action: "destination_hero_image.update",
      resourceId: id,
      resourceType: "DestinationHeroImage",
      details: `Updated hero image '${updated?.title || id}'`,
      before: existing,
      after: updated,
      status: "success",
    });

    return NextResponse.json({ success: true, image: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to update hero image" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!checkAdminPermission(admin, "destinations.delete") && !checkAdminPermission(admin, "destinations.update")) {
      return NextResponse.json({ success: false, message: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Image ID is required." }, { status: 400 });
    }

    const existing = getDestinationHeroImageById(id);
    const deleted = deleteDestinationHeroImage(id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Image not found or could not be deleted." }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "destinations",
      action: "destination_hero_image.delete",
      resourceId: id,
      resourceType: "DestinationHeroImage",
      details: `Deleted hero image '${existing?.title || id}'`,
      before: existing,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Hero image deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Failed to delete hero image" }, { status: 500 });
  }
}

