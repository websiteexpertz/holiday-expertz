import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getWebsiteSettings, updateWebsiteSettings } from "../../../../lib/storage/settingsStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const settings = getWebsiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Admin Settings GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "settings.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = updateWebsiteSettings(body);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "website_settings",
      action: "update_settings",
      details: "Updated global platform settings",
      status: "success",
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Admin Settings PUT Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update settings" }, { status: 500 });
  }
}
