import { NextRequest, NextResponse } from "next/server";
import { getInquiriesByOwnerId } from "../../../../lib/storage/inquiryStore";

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
        { success: false, message: "Unauthenticated. Please sign in as an owner." },
        { status: 401 }
      );
    }

    const inquiries = getInquiriesByOwnerId(ownerId);

    return NextResponse.json({
      success: true,
      inquiries,
      count: inquiries.length,
    });
  } catch (error: any) {
    console.error("Owner Inquiries GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch owner inquiries." },
      { status: 500 }
    );
  }
}
