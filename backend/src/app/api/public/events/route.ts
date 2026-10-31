import { NextResponse } from "next/server";
import { getPublishedEvents } from "../../../../lib/storage/eventStore";

export async function GET() {
  try {
    const events = getPublishedEvents();
    return NextResponse.json({ success: true, events });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching events" }, { status: 500 });
  }
}
