import { NextRequest, NextResponse } from "next/server";
import { getPublishedEvents, isEventUpcoming } from "../../../../lib/storage/eventStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.trim().toLowerCase();
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const includeExpired = searchParams.get("includeExpired") === "true";

    const now = new Date();
    // Only fetch published and actively eligible events (scheduled publishAt/unpublishAt respected)
    let events = getPublishedEvents({ now });

    if (slug) {
      const event = events.find(
        (e) => e.slug?.toLowerCase() === slug || e.id?.toLowerCase() === slug
      );
      if (!event) {
        return NextResponse.json(
          { success: false, message: "Event not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, event });
    }

    if (month) {
      const m = parseInt(month, 10);
      const y = year ? parseInt(year, 10) : null;
      events = events.filter((e) => {
        const start = new Date(e.startDate + "T00:00:00");
        const startMonth = start.getMonth() + 1;
        const startYear = start.getFullYear();

        const end = e.endDate ? new Date(e.endDate + "T23:59:59") : start;
        const endMonth = end.getMonth() + 1;
        const endYear = end.getFullYear();

        if (y !== null) {
          const inYear = startYear === y || endYear === y || e.editionYear === y;
          if (!inYear) return false;
        }

        const matchesMonth =
          startMonth === m ||
          endMonth === m ||
          (startMonth <= m && endMonth >= m);

        return matchesMonth;
      });
    } else if (!includeExpired) {
      // General upcoming events feed
      events = events.filter((e) => isEventUpcoming(e, now));
    }

    return NextResponse.json({ success: true, count: events.length, events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching events" },
      { status: 500 }
    );
  }
}
