import { NextRequest, NextResponse } from "next/server";
import { findOwnerById, sanitizeOwner, updateOwnerProfile } from "../../../../lib/storage/propertyOwnerStore";

function getAuthenticatedOwnerId(request: NextRequest): string | null {
  const headerId = request.headers.get("x-owner-id");
  if (headerId) return headerId;

  const cookieId = request.cookies.get("owner_id")?.value;
  if (cookieId) return cookieId;

  const url = new URL(request.url);
  return url.searchParams.get("ownerId");
}

export async function GET(request: NextRequest) {
  try {
    const ownerId = getAuthenticatedOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated. Please sign in." },
        { status: 401 }
      );
    }

    const record = await findOwnerById(ownerId);
    if (!record) {
      return NextResponse.json(
        { success: false, message: "Owner profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      owner: sanitizeOwner(record),
    });
  } catch (error) {
    console.error("API Error in /api/auth/me GET:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve owner session." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ownerId = getAuthenticatedOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, mobileNumber, avatar, businessName, address, bio, altPhone } = body;

    if (fullName && fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Full name must be at least 2 characters." },
        { status: 400 }
      );
    }

    const updated = await updateOwnerProfile(ownerId, {
      fullName: fullName?.trim(),
      mobileNumber: mobileNumber?.trim(),
      avatar: avatar?.trim(),
      businessName: businessName?.trim(),
      address: address?.trim(),
      bio: bio?.trim(),
      altPhone: altPhone?.trim(),
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Owner profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      owner: updated,
    });
  } catch (error) {
    console.error("API Error in /api/auth/me PUT:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile." },
      { status: 500 }
    );
  }
}
