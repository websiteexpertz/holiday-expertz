import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllEvents, createEvent, updateEvent, deleteEvent, getEventById } from "../../../../lib/storage/eventStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const events = getAllEvents();
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
    if (!body.title || !body.startDate || !body.endDate || !body.location) {
      return NextResponse.json({ success: false, message: "Title, dates, and location are required" }, { status: 400 });
    }

    const event = createEvent({
      title: body.title,
      slug: body.slug,
      description: body.description || "",
      coverImage: body.coverImage || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      startDate: body.startDate,
      endDate: body.endDate,
      location: body.location,
      city: body.city || "Udaipur",
      state: body.state || "Rajasthan",
      category: body.category || "Cultural Festival",
      registrationLink: body.registrationLink,
      status: body.status || "published",
      featured: Boolean(body.featured),
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "upcoming_events",
      action: "create_event",
      resourceId: event.id,
      resourceType: "event",
      details: `Created upcoming event "${event.title}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("Admin Events POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create event" }, { status: 500 });
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
