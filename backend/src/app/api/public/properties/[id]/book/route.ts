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

    // Calculate nights & pricing on server using advanced pricing rules if configured
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const basePrice = property.pricing?.pricePerNight || 0;
    const weekdayRate = property.pricing?.weekdayRate !== undefined ? property.pricing.weekdayRate : basePrice;
    const weekendRate = property.pricing?.weekendRate !== undefined ? property.pricing.weekendRate : (weekdayRate || basePrice);
    const weekendDays = Array.isArray(property.pricing?.weekendDays) ? property.pricing.weekendDays : [5, 6];
    const seasonalRates = property.pricing?.seasonalRates || [];
    const specialDateRates = property.pricing?.specialDateRates || [];

    let baseAmount = 0;
    const curr = new Date(start);
    for (let i = 0; i < nights; i++) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, "0");
      const dd = String(curr.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayOfWeek = curr.getDay();

      const special = specialDateRates.find((s) => dateStr >= s.startDate && dateStr <= (s.endDate || s.startDate));
      if (special) {
        baseAmount += Number(special.nightlyRate) || 0;
      } else {
        const seasonal = seasonalRates.find((s) => dateStr >= s.startDate && dateStr <= s.endDate);
        if (seasonal) {
          baseAmount += Number(seasonal.nightlyRate) || 0;
        } else if (weekendDays.includes(dayOfWeek)) {
          baseAmount += weekendRate;
        } else {
          baseAmount += weekdayRate;
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    const nightlyRate = nights > 0 ? Math.round(baseAmount / nights) : basePrice;
    const cleaningFee = Math.round(nightlyRate * 0.05);
    const taxes = Math.round(baseAmount * 0.12);

    // Process optional activities
    const rawSelectedActivities: any[] = Array.isArray(body.selectedActivities) ? body.selectedActivities : [];
    const validActivities: { id: string; name: string; price: number; chargeType: string; quantity: number }[] = [];
    let activitiesAmount = 0;

    const propertyActivities = property.pricing?.paidActivities || [];
    for (const item of rawSelectedActivities) {
      const actId = typeof item === "string" ? item : item.activityId || item.id;
      const act = propertyActivities.find((a) => a.id === actId);
      if (act) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        let cost = 0;
        if (act.chargeType === "PER_PERSON") {
          cost = act.price * (Number(guests) || 1);
        } else {
          cost = act.price * qty;
        }
        activitiesAmount += cost;
        validActivities.push({
          id: act.id,
          name: act.name,
          price: act.price,
          chargeType: act.chargeType,
          quantity: qty,
        });
      }
    }

    const totalAmount = baseAmount + activitiesAmount + cleaningFee + taxes;

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
      currency: property.pricing?.currency || "USD",
      selectedActivities: validActivities.length > 0 ? validActivities : undefined,
      activitiesAmount: activitiesAmount > 0 ? activitiesAmount : undefined,
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
        activitiesAmount,
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
