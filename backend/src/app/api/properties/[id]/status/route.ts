import { NextRequest, NextResponse } from "next/server";
import { moderatePropertyStatus } from "../../../../../lib/services/propertyService";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!status || (status !== "approved" && status !== "rejected" && status !== "pending_approval")) {
      return NextResponse.json(
        { success: false, message: "Invalid status transition requested." },
        { status: 400 }
      );
    }

    const result = moderatePropertyStatus(id, status, rejectionReason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      property: result.data,
    });
  } catch (error) {
    console.error("API Error in /api/properties/[id]/status POST:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update property status." },
      { status: 500 }
    );
  }
}
