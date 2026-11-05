import { NextRequest, NextResponse } from "next/server";
import { getAllCustomers } from "../../../../../lib/storage/userStore";
import { verifyPassword } from "../../../../../lib/security/passwordHasher";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const customers = getAllCustomers();
    const traveller = customers.find(
      (c) => c.email.toLowerCase() === cleanEmail
    );

    if (!traveller) {
      return NextResponse.json(
        { success: false, message: "No traveller account found with this email." },
        { status: 401 }
      );
    }

    if (traveller.status === "suspended") {
      return NextResponse.json(
        { success: false, message: "Your account is temporarily suspended. Please contact concierge support." },
        { status: 403 }
      );
    }

    // Verify password if hash exists
    if (traveller.passwordHash && traveller.passwordSalt) {
      const isValid = verifyPassword(password, traveller.passwordHash, traveller.passwordSalt);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Invalid email or password." },
          { status: 401 }
        );
      }
    }

    // Strip password fields
    const { passwordHash: _, passwordSalt: __, ...sanitized } = traveller;

    return NextResponse.json(
      {
        success: true,
        message: `Welcome back, ${traveller.fullName}!`,
        traveller: sanitized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Traveller login error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}

