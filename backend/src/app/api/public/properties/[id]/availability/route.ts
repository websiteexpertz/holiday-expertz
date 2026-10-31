import { NextRequest, NextResponse } from "next/server";
import { getPropertyById } from "../../../../../../lib/storage/propertyStore";
import { getAllBookings } from "../../../../../../lib/storage/bookingStore";
import { BookingRecord } from "../../../../../../types/admin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const property = getPropertyById(id);

    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found" },
        { status: 404 }
      );
    }

    const bookings: BookingRecord[] = getAllBookings().filter(
      (b: BookingRecord) => b.propertyId === id && b.bookingStatus !== "cancelled"
    );

    const bookedRanges = bookings.map((b: BookingRecord) => ({
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      bookingStatus: b.bookingStatus,
    }));

    return NextResponse.json({
      success: true,
      propertyId: id,
      bookedRanges,
      minStay: 1,
      checkInTime: property.capacity?.checkInTime || "14:00",
      checkOutTime: property.capacity?.checkOutTime || "11:00",
    });
  } catch (error) {
    console.error("Error fetching property availability:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
