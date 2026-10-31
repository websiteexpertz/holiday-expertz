import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllBookings, getBookingById, updateBooking, deleteBooking } from "../../../../lib/storage/bookingStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const search = searchParams.get("search")?.toLowerCase().trim();

    let bookings = getAllBookings();

    if (status && status !== "all") {
      bookings = bookings.filter((b) => b.bookingStatus === status);
    }

    if (paymentStatus && paymentStatus !== "all") {
      bookings = bookings.filter((b) => b.paymentStatus === paymentStatus);
    }

    if (search) {
      bookings = bookings.filter(
        (b) =>
          b.bookingReference.toLowerCase().includes(search) ||
          b.customerName.toLowerCase().includes(search) ||
          b.customerEmail.toLowerCase().includes(search) ||
          b.propertyName.toLowerCase().includes(search) ||
          b.propertyCity.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, bookings, total: bookings.length });
  } catch (error) {
    console.error("Admin Bookings GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "bookings.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, bookingStatus, paymentStatus, cancellationReason } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Booking id required" }, { status: 400 });
    }

    const booking = getBookingById(id);
    if (!booking) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (bookingStatus) updates.bookingStatus = bookingStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (cancellationReason) updates.cancellationReason = cancellationReason;

    const updated = updateBooking(id, updates);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "bookings_management",
      action: "update_booking",
      resourceId: id,
      resourceType: "booking",
      details: `Updated booking ${booking.bookingReference} status to ${bookingStatus || booking.bookingStatus}`,
      status: "success",
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Admin Bookings PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "bookings.cancel")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Booking id required" }, { status: 400 });
    }

    const booking = getBookingById(id);
    const success = deleteBooking(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "bookings_management",
      action: "delete_booking",
      resourceId: id,
      resourceType: "booking",
      details: `Deleted booking ${booking?.bookingReference || id}`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Booking deleted" });
  } catch (error) {
    console.error("Admin Bookings DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete booking" }, { status: 500 });
  }
}
