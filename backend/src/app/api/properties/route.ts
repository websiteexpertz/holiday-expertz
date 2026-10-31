import { NextRequest, NextResponse } from "next/server";
import {
  createOwnerProperty,
  getOwnerPropertiesAndStats,
} from "../../../lib/services/propertyService";

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const propertyType = searchParams.get("propertyType") || "all";
    const search = searchParams.get("search") || "";

    const { properties, stats } = getOwnerPropertiesAndStats(ownerId, {
      status,
      propertyType,
      search,
    });

    return NextResponse.json({
      success: true,
      properties,
      stats,
    });
  } catch (error) {
    console.error("API Error in /api/properties GET:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve properties." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ownerId = getAuthenticatedOwnerId(request);
    if (!ownerId) {
      return NextResponse.json(
        { success: false, message: "Unauthenticated. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { submitImmediately = false, ...propertyInput } = body;

    const result = createOwnerProperty(ownerId, propertyInput, submitImmediately);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errors: result.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        property: result.data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error in /api/properties POST:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save property." },
      { status: 500 }
    );
  }
}
