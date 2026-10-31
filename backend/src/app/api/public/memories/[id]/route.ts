import { NextRequest, NextResponse } from "next/server";
import { getMemoryById } from "../../../../../lib/storage/memoryStore";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const memory = getMemoryById(id);

    if (!memory || !memory.isPublished || !memory.isActive || memory.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Memory story not found or is currently private." },
        { status: 404 }
      );
    }

    // Never expose private guest email publicly
    const { guestEmail, ...publicMemory } = memory;

    return NextResponse.json({
      success: true,
      memory: publicMemory,
    });
  } catch (error) {
    console.error("Public Memory Detail GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve memory story." },
      { status: 500 }
    );
  }
}

