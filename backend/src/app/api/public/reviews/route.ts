import { NextRequest, NextResponse } from "next/server";
import { getApprovedPublicReviews, createReview } from "../../../../lib/storage/reviewStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    let reviews = getApprovedPublicReviews();
    if (propertyId) {
      reviews = reviews.filter((r) => r.propertyId === propertyId);
    }

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const author = body.author || body.userName || body.name;
    const comment = body.comment || body.review || body.text;
    const rating = body.rating;
    const propertyId = body.propertyId;
    const propertyName = body.propertyName;
    const location = body.location;
    const avatar = body.avatar;

    if (!author?.trim() || !comment?.trim()) {
      return NextResponse.json(
        { success: false, message: "Author name and comment are required" },
        { status: 400 }
      );
    }

    const review = createReview({
      author: author.trim(),
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(author)}`,
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: comment.trim(),
      propertyId: propertyId || "",
      propertyName: propertyName || "Luxury Stay",
      location: location || "Verified Traveler",
      status: "approved", // auto-approve for public demo or moderated
      featured: false,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your review has been submitted.",
      review,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit review" },
      { status: 500 }
    );
  }
}
