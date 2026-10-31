import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllFeaturedDestinations,
  createFeaturedDestination,
  updateFeaturedDestination,
  deleteFeaturedDestination,
  reorderFeaturedDestinations,
} from "../../../../lib/storage/featuredDestinationStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const all = getAllFeaturedDestinations().sort((a, b) => a.order - b.order);
    return NextResponse.json({ success: true, destinations: all, total: all.length });
  } catch (err) {
    console.error("Admin Featured Destinations GET Error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "destinations.create")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, countryId, stateId, cityId, areaId, imageUrl, headline, description, order, isActive } = body;

    if (!name || !countryId || !imageUrl || !headline || !description) {
      return NextResponse.json(
        { success: false, message: "name, countryId, imageUrl, headline, and description are required" },
        { status: 400 }
      );
    }

    const item = createFeaturedDestination({
      name,
      countryId,
      stateId: stateId || undefined,
      cityId: cityId || undefined,
      areaId: areaId || undefined,
      imageUrl,
      headline,
      description,
      order: order || 99,
      isActive: isActive !== false,
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "featured_destinations",
      action: "create_featured_destination",
      resourceId: item.id,
      resourceType: "featured_destination",
      details: `Created Featured Destination: ${name}`,
      status: "success",
    });

    return NextResponse.json({ success: true, destination: item });
  } catch (err) {
    console.error("Admin Featured Destinations POST Error:", err);
    return NextResponse.json({ success: false, message: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "destinations.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Handle reorder
    if (Array.isArray(body.orderedIds)) {
      const items = reorderFeaturedDestinations(body.orderedIds);
      return NextResponse.json({ success: true, destinations: items });
    }

    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });
    }

    const updated = updateFeaturedDestination(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "featured_destinations",
      action: "update_featured_destination",
      resourceId: id,
      resourceType: "featured_destination",
      details: `Updated Featured Destination: ${updated.name}`,
      status: "success",
    });

    return NextResponse.json({ success: true, destination: updated });
  } catch (err) {
    console.error("Admin Featured Destinations PUT Error:", err);
    return NextResponse.json({ success: false, message: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "destinations.delete")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });
    }

    const removed = deleteFeaturedDestination(id);
    if (!removed) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "featured_destinations",
      action: "delete_featured_destination",
      resourceId: id,
      resourceType: "featured_destination",
      details: `Deleted Featured Destination: ${id}`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error("Admin Featured Destinations DELETE Error:", err);
    return NextResponse.json({ success: false, message: "Failed to delete" }, { status: 500 });
  }
}

