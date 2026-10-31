import { NextRequest, NextResponse } from "next/server";
import { getPropertyById } from "../../../../../lib/storage/propertyStore";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const property = getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    // Public detail view only shows approved properties (or allows preview if explicitly permitted)
    if (property.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Property is currently under review or unavailable" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      property,
    });
  } catch (error) {
    console.error("Error fetching public property by ID:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch property details" },
      { status: 500 }
    );
  }
}
