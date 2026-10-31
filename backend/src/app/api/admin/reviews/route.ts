import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllReviews, updateReview, deleteReview, getReviewById } from "../../../../lib/storage/reviewStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const reviews = getAllReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Admin Reviews GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "reviews.moderate")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Review ID required" }, { status: 400 });
    }

    const updated = updateReview(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "reviews_and_testimonials",
      action: "update_review",
      resourceId: id,
      resourceType: "review",
      details: `Updated review by "${updated.author}" (Status: ${updated.status}, Featured: ${updated.featured})`,
      status: "success",
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error("Admin Reviews PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "reviews.delete")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Review ID required" }, { status: 400 });
    }

    const rev = getReviewById(id);
    const success = deleteReview(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "reviews_and_testimonials",
      action: "delete_review",
      resourceId: id,
      resourceType: "review",
      details: `Deleted review by "${rev?.author || id}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Admin Reviews DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete review" }, { status: 500 });
  }
}
