import { NextResponse } from "next/server";
import { loginAdmin } from "../../../../../lib/security/adminAuthService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const result = await loginAdmin(email, password, ipAddress);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, message: result.error || "Authentication failed" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin authenticated successfully",
      admin: result.admin,
      token: result.token,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "admin_session",
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Admin Login Route Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected server error occurred during admin login" },
      { status: 500 }
    );
  }
}
