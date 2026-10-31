import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "../../../../../lib/security/adminAuthService";
import { recordAuditLog } from "../../../../../lib/storage/auditLogStore";

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (admin) {
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "admin_management",
        action: "logout",
        details: `Admin ${admin.fullName} logged out`,
        status: "success",
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin logged out successfully",
    });

    response.cookies.set({
      name: "admin_session",
      value: "",
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin Logout Route Error:", error);
    return NextResponse.json(
      { success: false, message: "Error during logout" },
      { status: 500 }
    );
  }
}
