import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllHandpicked,
  addHandpickedItem,
  removeHandpickedItem,
  updateHandpickedItem,
} from "../../../../lib/storage/handpickedStore";
import { getAllProperties, togglePropertyHandpickedRecord } from "../../../../lib/storage/propertyStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const items = getAllHandpicked().sort((a, b) => a.priorityOrder - b.priorityOrder);
    const allProps = getAllProperties();
    const propMap = new Map(allProps.map((p) => [p.id, p]));

    const enriched = items.map((item) => {
      const prop = propMap.get(item.propertyId);
      return {
        ...item,
        propertyName: prop?.name || "Unknown Property",
        city: prop?.location?.city || "Unknown City",
        state: prop?.location?.state || "Unknown State",
        coverImage: prop?.images?.[0]?.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        pricePerNight: prop?.pricing?.pricePerNight || 0,
      };
    });

    return NextResponse.json({ success: true, handpicked: enriched, availableProperties: allProps });
  } catch (error) {
    console.error("Admin Handpicked GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch handpicked properties" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "handpicked.manage")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { propertyId, badge, priorityOrder, featuredQuote } = body;

    if (!propertyId) {
      return NextResponse.json({ success: false, message: "propertyId is required" }, { status: 400 });
    }

    const item = addHandpickedItem({ propertyId, badge, priorityOrder, featuredQuote });
    // Also ensure property has handpicked: true
    togglePropertyHandpickedRecord(propertyId);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "handpicked_properties",
      action: "add_handpicked",
      resourceId: propertyId,
      resourceType: "property",
      details: `Added property ${propertyId} to Handpicked collection with badge "${badge || "Handpicked"}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("Admin Handpicked POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to add handpicked property" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "handpicked.manage")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    const updated = updateHandpickedItem(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "handpicked_properties",
      action: "update_handpicked",
      resourceId: id,
      resourceType: "handpicked",
      details: `Updated handpicked property configuration ${id}`,
      status: "success",
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Admin Handpicked PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update handpicked item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "handpicked.manage")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
    }

    const success = removeHandpickedItem(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Item not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "handpicked_properties",
      action: "remove_handpicked",
      resourceId: id,
      resourceType: "handpicked",
      details: `Removed property ${id} from Handpicked collection`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Removed from handpicked" });
  } catch (error) {
    console.error("Admin Handpicked DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to remove handpicked item" }, { status: 500 });
  }
}
