import { NextRequest, NextResponse } from "next/server";
import { getAllCustomers, saveCustomers } from "../../../../../lib/storage/userStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const email = searchParams.get("email");

    if (!id && !email) {
      return NextResponse.json(
        { success: false, message: "Traveller id or email is required." },
        { status: 400 }
      );
    }

    const customers = getAllCustomers();
    const traveller = customers.find(
      (c) => (id && c.id === id) || (email && c.email.toLowerCase() === email.toLowerCase().trim())
    );

    if (!traveller) {
      return NextResponse.json(
        { success: false, message: "Traveller not found." },
        { status: 404 }
      );
    }

    const { passwordHash: _, passwordSalt: __, ...sanitized } = traveller;
    return NextResponse.json({ success: true, traveller: sanitized });
  } catch (error) {
    console.error("Traveller profile GET error:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching traveller profile." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, fullName, phone, city, country, avatar } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Traveller ID is required to update profile." },
        { status: 400 }
      );
    }

    const customers = getAllCustomers();
    const index = customers.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Traveller not found." },
        { status: 404 }
      );
    }

    const current = customers[index];
    const updated = {
      ...current,
      fullName: fullName !== undefined ? fullName.trim() : current.fullName,
      phone: phone !== undefined ? phone.trim() : current.phone,
      city: city !== undefined ? city.trim() : current.city,
      country: country !== undefined ? country.trim() : current.country,
      avatar: avatar !== undefined ? avatar : current.avatar,
      updatedAt: new Date().toISOString(),
    };

    customers[index] = updated;
    saveCustomers(customers);

    const { passwordHash: _, passwordSalt: __, ...sanitized } = updated;

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      traveller: sanitized,
    });
  } catch (error) {
    console.error("Traveller profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Error updating traveller profile." },
      { status: 500 }
    );
  }
}

