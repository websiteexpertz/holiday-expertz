import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "../../../../../lib/security/adminAuthService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized admin access" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Admin Auth Me Route Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error validating admin session" },
      { status: 500 }
    );
  }
}
