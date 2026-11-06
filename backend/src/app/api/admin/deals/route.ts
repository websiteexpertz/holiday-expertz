import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllDealsAsync, createDealAsync, updateDealAsync, deleteDealAsync, getDealById } from "../../../../lib/storage/dealStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const deals = await getAllDealsAsync();
    return NextResponse.json({ success: true, deals });
  } catch (error) {
    console.error("Admin Deals GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch deals" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "deals.create")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.discountValue) {
      return NextResponse.json({ success: false, message: "Title and discount value are required" }, { status: 400 });
    }

    const deal = await createDealAsync({
      title: body.title,
      slug: body.slug,
      description: body.description || "",
      promoImage: body.promoImage || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      discountType: body.discountType || "percentage",
      discountValue: Number(body.discountValue),
      couponCode: body.couponCode,
      startDate: body.startDate || new Date().toISOString().split("T")[0],
      endDate: body.endDate || "2026-12-31",
      applicableCategory: body.applicableCategory,
      status: body.status || "active",
      featured: Boolean(body.featured),
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "deals_management",
      action: "create_deal",
      resourceId: deal.id,
      resourceType: "deal",
      details: `Created deal "${deal.title}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, deal });
  } catch (error) {
    console.error("Admin Deals POST Error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? `Failed to create deal: ${error.message}` : "Failed to create deal" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "deals.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Deal ID required" }, { status: 400 });
    }

    const updated = await updateDealAsync(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Deal not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "deals_management",
      action: "update_deal",
      resourceId: id,
      resourceType: "deal",
      details: `Updated deal "${updated.title}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, deal: updated });
  } catch (error) {
    console.error("Admin Deals PUT Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update deal" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "deals.delete")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Deal ID required" }, { status: 400 });
    }

    const deal = getDealById(id);
    const success = await deleteDealAsync(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Deal not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "deals_management",
      action: "delete_deal",
      resourceId: id,
      resourceType: "deal",
      details: `Deleted deal "${deal?.title || id}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Deal deleted successfully" });
  } catch (error) {
    console.error("Admin Deals DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete deal" }, { status: 500 });
  }
}
