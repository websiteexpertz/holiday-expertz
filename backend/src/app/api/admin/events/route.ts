import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  duplicateEventForYear,
} from "../../../../lib/storage/eventStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const categoryFilter = searchParams.get("category");
    const yearFilter = searchParams.get("year");

    let events = getAllEvents();

    if (statusFilter && statusFilter !== "all") {
      events = events.filter((e) => e.status === statusFilter);
    }

    if (categoryFilter && categoryFilter !== "all") {
      events = events.filter((e) => e.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    if (yearFilter) {
      const y = parseInt(yearFilter, 10);
      events = events.filter((e) => {
        const startY = new Date(e.startDate).getFullYear();
        const endY = new Date(e.endDate || e.startDate).getFullYear();
        return startY === y || endY === y || e.editionYear === y;
      });
    }

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("Admin Events GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "events.create")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Check if this is an annual/recurring event duplication action
    if (body.action === "duplicate_year") {
      if (!body.sourceId || !body.targetYear) {
        return NextResponse.json(
          { success: false, message: "sourceId and targetYear are required for year duplication" },
          { status: 400 }
        );
      }

      const duplicated = duplicateEventForYear(body.sourceId, body.targetYear, body.newDates);

      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "upcoming_events",
        action: "duplicate_event_year",
        resourceId: duplicated.id,
        resourceType: "event",
        details: `Created annual occurrence "${duplicated.title}" for year ${body.targetYear}`,
        status: "success",
      });

      return NextResponse.json({ success: true, event: duplicated });
    }

    if (!body.title || !body.startDate || !body.endDate || !body.location) {
      return NextResponse.json(
        { success: false, message: "Title, start date, end date, and location are required" },
        { status: 400 }
      );
    }

    const event = createEvent({
      title: body.title,
      slug: body.slug,
      description: body.description || "",
      longDescription: body.longDescription || body.description || "",
      coverImage:
        body.coverImage ||
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      startDate: body.startDate,
      endDate: body.endDate,
      time: body.time || "09:00 AM - 08:00 PM",
      location: body.location,
      city: body.city || "Udaipur",
      state: body.state || "Rajasthan",
      country: body.country || "India",
      category: body.category || "Cultural",
      price: body.price || "Free Entry",
      highlights: Array.isArray(body.highlights)
        ? body.highlights
        : body.highlights
        ? [body.highlights]
        : ["Cultural Performances", "Guided Heritage Access"],
      organizer: body.organizer || "Heritage Tourism Council",
      registrationLink: body.registrationLink || "",
      status: body.status || "published",
      featured: Boolean(body.featured),
      timezone: body.timezone || "Asia/Kolkata",
      publishAt: body.publishAt || undefined,
      unpublishAt: body.unpublishAt || undefined,
      isRecurring: Boolean(body.isRecurring),
      recurrenceFrequency: body.isRecurring ? (body.recurrenceFrequency || "annual") : "none",
      seriesId: body.seriesId || undefined,
      editionYear: body.editionYear || new Date(body.startDate).getFullYear(),
      source: body.source || "manual",
      externalId: body.externalId || undefined,
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "upcoming_events",
      action: "create_event",
      resourceId: event.id,
      resourceType: "event",
      details: `Created event "${event.title}" [status: ${event.status}]`,
      status: "success",
    });

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Admin Events POST Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "events.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Event ID required" }, { status: 400 });
    }

    const updated = updateEvent(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "upcoming_events",
      action: "update_event",
      resourceId: id,
      resourceType: "event",
      details: `Updated event "${updated.title}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error("Admin Events PUT Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "events.delete")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Event ID required" }, { status: 400 });
    }

    const event = getEventById(id);
    if (!event) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }
    deleteEvent(id);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "upcoming_events",
      action: "delete_event",
      resourceId: id,
      resourceType: "event",
      details: `Deleted event "${event?.title || id}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    console.error("Admin Events DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete event" }, { status: 500 });
  }
}
