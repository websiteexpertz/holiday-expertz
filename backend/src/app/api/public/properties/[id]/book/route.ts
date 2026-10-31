import { NextRequest, NextResponse } from "next/server";
import { getPropertyById } from "../../../../../../lib/storage/propertyStore";
import { getAllBookings, createBooking } from "../../../../../../lib/storage/bookingStore";
import { BookingRecord } from "../../../../../../types/admin";

export async function POST(
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

    if (property.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "This property is not currently accepting bookings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const checkInDate = body.checkInDate || body.checkIn;
    const checkOutDate = body.checkOutDate || body.checkOut;
    const guests = body.guests ?? (body.adults ? (Number(body.adults) + Number(body.children || 0)) : 1);
    const customerName = body.customerName || body.guestName;
    const customerEmail = body.customerEmail || body.guestEmail;
    const customerPhone = body.customerPhone || body.guestPhone || "";
    const specialRequests = body.specialRequests || "";

    // Validation
    if (!checkInDate || !checkOutDate) {
      return NextResponse.json(
        { success: false, message: "Check-in and Check-out dates are required" },
        { status: 400 }
      );
    }

    if (!customerName?.trim() || !customerEmail?.trim()) {
      return NextResponse.json(
        { success: false, message: "Guest name and email address are required" },
        { status: 400 }
      );
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { success: false, message: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    // Server-side overlap checking
    const existingBookings: BookingRecord[] = getAllBookings().filter(
      (b: BookingRecord) => b.propertyId === id && b.bookingStatus !== "cancelled"
    );

    const hasConflict = existingBookings.some((b: BookingRecord) => {
      const bStart = new Date(b.checkInDate);
      const bEnd = new Date(b.checkOutDate);
      return start < bEnd && end > bStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected dates overlap with an existing reservation. Please select different dates.",
        },
        { status: 409 }
      );
    }

    // Calculate nights & pricing on server
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const nightlyRate = property.pricing?.pricePerNight || 0;
    const baseAmount = nights * nightlyRate;
    const cleaningFee = Math.round(nightlyRate * 0.05);
    const taxes = Math.round(baseAmount * 0.12);
    const totalAmount = baseAmount + cleaningFee + taxes;

    const guestCount = Math.min(
      Math.max(1, Number(guests) || 1),
      property.capacity?.maxGuests || 10
    );

    const booking = createBooking({
      propertyId: property.id,
      propertyName: property.name,
      propertyCoverImage:
        property.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      propertyCity: property.location?.city || "",
      ownerId: property.ownerId,
      ownerName: property.contactDetails?.contactPerson || "Verified Host",
      customerId: `cust_${Date.now()}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone ? customerPhone.trim() : "",
      checkInDate,
      checkOutDate,
      guests: guestCount,
      totalAmount,
      currency: property.pricing?.currency || "INR",
      bookingStatus: "confirmed",
      paymentStatus: "paid",
      specialRequests: specialRequests ? specialRequests.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Reservation confirmed successfully!",
      booking,
      summary: {
        nights,
        nightlyRate,
        baseAmount,
        cleaningFee,
        taxes,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { success: false, message: "Server error creating reservation" },
      { status: 500 }
    );
  }
}
