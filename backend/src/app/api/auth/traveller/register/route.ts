import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAllCustomers, saveCustomers } from "../../../../../lib/storage/userStore";
import { hashPassword } from "../../../../../lib/security/passwordHasher";
import { CustomerUserRecord } from "../../../../../types/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, password, city, country } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const customers = getAllCustomers();

    const existing = customers.find(
      (c) => c.email.toLowerCase() === cleanEmail
    );

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();

    const newTraveller: CustomerUserRecord = {
      id: `trav_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : "",
      city: city ? city.trim() : "",
      country: country ? country.trim() : "India",
      status: "active",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
      totalBookings: 0,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: now,
      updatedAt: now,
    };

    customers.push(newTraveller);
    saveCustomers(customers);

    // Sanitize output (do not expose password hash / salt)
    const { passwordHash: _, passwordSalt: __, ...sanitized } = newTraveller;

    return NextResponse.json(
      {
        success: true,
        message: "Your traveller account has been created successfully!",
        traveller: sanitized,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Traveller registration API error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}

