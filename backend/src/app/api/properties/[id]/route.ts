import { NextRequest, NextResponse } from "next/server";
import {
  getPropertyById,
} from "../../../../lib/storage/propertyStore";
import {
  updateOwnerProperty,
  deleteOwnerProperty,
} from "../../../../lib/services/propertyService";

function getAuthenticatedOwnerId(request: NextRequest): string | null {
  const headerId = request.headers.get("x-owner-id");
  if (headerId) return headerId;

  const cookieId = request.cookies.get("owner_id")?.value;
  if (cookieId) return cookieId;

  const url = new URL(request.url);
  return url.searchParams.get("ownerId");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found." },
        { status: 404 }
      );
    }

    const ownerId = getAuthenticatedOwnerId(request);

    // If property is approved, anyone can view it. If draft/pending/rejected, only owner can view it.
    if (property.status !== "approved" && property.ownerId !== ownerId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to view this listing." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("API Error in /api/properties/[id] GET:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve property." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerId = getAuthenticatedOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { resubmit = false, ...updates } = body;

    const result = updateOwnerProperty(ownerId, id, updates, resubmit);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message, errors: result.errors },
        { status: result.message.includes("Unauthorized") ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      property: result.data,
    });
  } catch (error) {
    console.error("API Error in /api/properties/[id] PUT:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update property." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerId = getAuthenticatedOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated. Please sign in." },
        { status: 401 }
      );
    }

    const result = deleteOwnerProperty(ownerId, id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.message.includes("Unauthorized") ? 403 : 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("API Error in /api/properties/[id] DELETE:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete property." },
      { status: 500 }
    );
  }
}
