import { NextRequest, NextResponse } from "next/server";
import { getPublicMemories } from "../../../../lib/storage/memoryStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const memories = getPublicMemories();
    return NextResponse.json({
      success: true,
      memories,
      total: memories.length,
    });
  } catch (error) {
    console.error("Public Memories GET API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve public memories." },
      { status: 500 }
    );
  }
}

