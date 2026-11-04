import { NextRequest, NextResponse } from "next/server";
import { getPublishedEvents } from "../../../../../lib/storage/eventStore";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

    const events = getPublishedEvents();
    const event = events.find(
      (e) => e.slug?.toLowerCase() === cleanSlug || e.id?.toLowerCase() === cleanSlug
    );

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Error fetching single event:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching event details" },
      { status: 500 }
    );
  }
}

