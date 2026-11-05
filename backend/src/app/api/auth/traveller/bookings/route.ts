import { NextRequest, NextResponse } from "next/server";
import { getAllBookings } from "../../../../../lib/storage/bookingStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const customerEmail = searchParams.get("email");

    if (!customerId && !customerEmail) {
      return NextResponse.json(
        { success: false, message: "Customer ID or email required." },
        { status: 400 }
      );
    }

    const allBookings = getAllBookings();
    const cleanEmail = customerEmail ? customerEmail.toLowerCase().trim() : "";

    const userBookings = allBookings.filter((b) => {
      const matchId = customerId && b.customerId === customerId;
      const matchEmail = cleanEmail && b.customerEmail?.toLowerCase() === cleanEmail;
      return matchId || matchEmail;
    });

    return NextResponse.json({
      success: true,
      bookings: userBookings,
      total: userBookings.length,
    });
  } catch (error) {
    console.error("Traveller bookings API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load bookings." },
      { status: 500 }
    );
  }
}

