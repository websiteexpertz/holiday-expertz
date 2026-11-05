import { NextResponse } from "next/server";
import { getHeroBannerContent } from "../../../../lib/storage/heroContentStore";

export async function GET() {
  try {
    const heroContent = getHeroBannerContent();
    return NextResponse.json({
      success: true,
      slots: heroContent.slots,
      updatedAt: heroContent.updatedAt,
    });
  } catch (error) {
    console.error("Public Hero Content GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching hero banner content" },
      { status: 500 }
    );
  }
}

