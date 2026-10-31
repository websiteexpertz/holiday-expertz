import { NextResponse } from "next/server";
import { getPublicFeaturedDestinations } from "../../../../lib/storage/featuredDestinationStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const destinations = getPublicFeaturedDestinations();
    return NextResponse.json({ success: true, destinations, total: destinations.length });
  } catch (err) {
    console.error("Public Featured Destinations Error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch featured destinations", destinations: [] },
      { status: 500 }
    );
  }
}

