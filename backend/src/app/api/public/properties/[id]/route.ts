import { NextRequest, NextResponse } from "next/server";
import { getPropertyById } from "../../../../../lib/storage/propertyStore";
import { connectToDatabase } from "../../../../../lib/db/mongodb";
import { PropertyModel } from "../../../../../lib/models/Property";
import { getAuthenticatedAdmin } from "../../../../../lib/security/adminAuthService";
import { findOwnerById } from "../../../../../lib/storage/propertyOwnerStore";
import { getReviewsByPropertyId } from "../../../../../lib/storage/reviewStore";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    let property = getPropertyById(id);

    // Fallback to MongoDB if not cached in memory
    if (!property) {
      await connectToDatabase();
      const doc = await PropertyModel.findOne({ id }).lean();
      if (doc) {
        property = doc as any;
      }
    }

    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    // Public detail view only shows approved properties (or allows preview for authenticated Super Admin)
    if (property.status !== "approved") {
      const admin = getAuthenticatedAdmin(request);
      if (!admin) {
        return NextResponse.json(
          { success: false, message: "Property is currently under review or unavailable" },
          { status: 403 }
        );
      }
    }

    // Clone to safely enrich with real owner profile and reviews without modifying shared cache
    const enrichedProperty = { ...property };

    if (enrichedProperty.ownerId) {
      try {
        const ownerRecord = await findOwnerById(enrichedProperty.ownerId);
        if (ownerRecord) {
          enrichedProperty.owner = {
            id: ownerRecord.id,
            fullName: ownerRecord.fullName,
            avatar: ownerRecord.avatar || ownerRecord.profileImage || undefined,
            profileImage: ownerRecord.profileImage || ownerRecord.avatar || null,
            languagesSpoken: ownerRecord.languagesSpoken || [],
            aboutOwner: ownerRecord.aboutOwner || ownerRecord.bio || "",
            ownerNumber: ownerRecord.ownerNumber || undefined,
            businessName: ownerRecord.businessName || undefined,
          };
          if (!enrichedProperty.ownerNumber && ownerRecord.ownerNumber) {
            enrichedProperty.ownerNumber = ownerRecord.ownerNumber;
          }
        }
      } catch (err) {
        console.warn("Could not enrich property owner:", (err as Error)?.message);
      }
    }

    try {
      const reviewsList = getReviewsByPropertyId(enrichedProperty.id);
      const approvedReviews = reviewsList.filter((r) => r.status === "approved" || !r.status);
      if (approvedReviews.length > 0) {
        enrichedProperty.reviews = approvedReviews;
        const avg = approvedReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / approvedReviews.length;
        enrichedProperty.rating = Math.round(avg * 10) / 10;
        enrichedProperty.reviewCount = approvedReviews.length;
      }
    } catch (err) {
      console.warn("Could not enrich property reviews:", (err as Error)?.message);
    }

    return NextResponse.json({
      success: true,
      property: enrichedProperty,
    });
  } catch (error) {
    console.error("Error fetching public property by ID:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch property details" },
      { status: 500 }
    );
  }
}
