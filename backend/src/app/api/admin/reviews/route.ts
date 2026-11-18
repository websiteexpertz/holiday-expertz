import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllReviews,
  getReviewsByPropertyId,
  createReview,
  updateReview,
  deleteReview,
  getReviewById,
  recalculatePropertyRating,
} from "../../../../lib/storage/reviewStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    let reviews = propertyId ? getReviewsByPropertyId(propertyId) : getAllReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Admin Reviews GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "reviews.moderate")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { author, rating, title, comment, propertyId, propertyName, location, date, status, featured } = body;

    if (!author || typeof author !== "string" || !author.trim()) {
      return NextResponse.json({ success: false, message: "Guest/Reviewer name is required." }, { status: 400 });
    }

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5));

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json({ success: false, message: "Review description/comment is required." }, { status: 400 });
    }

    const reviewDate = date && typeof date === "string" && date.trim() ? date.trim() : new Date().toISOString().split("T")[0];

    const newReview = createReview({
      author: author.trim(),
      rating: numericRating,
      title: title && typeof title === "string" ? title.trim().slice(0, 150) : undefined,
      comment: comment.trim().slice(0, 5000),
      propertyId: propertyId ? String(propertyId).trim() : undefined,
      propertyName: propertyName ? String(propertyName).trim() : undefined,
      location: location ? String(location).trim() : "Verified Guest",
      date: reviewDate,
      status: ["approved", "pending", "hidden"].includes(status) ? status : "approved",
      featured: Boolean(featured),
      source: "ADMIN_IMPORTED",
      verificationStatus: "UNVERIFIED",
    });

    if (newReview.propertyId) {
      recalculatePropertyRating(newReview.propertyId);
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "reviews_and_testimonials",
      action: "admin_create_review",
      resourceId: newReview.id,
      resourceType: "review",
      details: `Added review by "${newReview.author}" for property "${newReview.propertyName || newReview.propertyId || "General"}" (${newReview.rating}★)`,
      status: "success",
    });

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error) {
    console.error("Admin Reviews POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create review" }, { status: 500 });
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

    if (updates.rating !== undefined) {
      updates.rating = Math.max(1, Math.min(5, Number(updates.rating) || 5));
    }
    if (updates.author !== undefined) {
      updates.author = String(updates.author).trim();
    }
    if (updates.comment !== undefined) {
      updates.comment = String(updates.comment).trim().slice(0, 5000);
    }
    if (updates.title !== undefined) {
      updates.title = String(updates.title).trim().slice(0, 150);
    }
    updates.updatedAt = new Date().toISOString();

    const updated = updateReview(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    if (updated.propertyId) {
      recalculatePropertyRating(updated.propertyId);
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "reviews_and_testimonials",
      action: "update_review",
      resourceId: id,
      resourceType: "review",
      details: `Updated review by "${updated.author}" (Rating: ${updated.rating}★, Status: ${updated.status})`,
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

    if (rev?.propertyId) {
      recalculatePropertyRating(rev.propertyId);
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
