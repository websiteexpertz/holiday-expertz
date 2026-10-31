import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getWebsiteContent, updateWebsiteContent } from "../../../../lib/storage/contentStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const content = getWebsiteContent();
    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error("Admin Content GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch website content" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "content.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = updateWebsiteContent(body);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "website_content",
      action: "update_content",
      details: "Updated website dynamic content (Hero, Why Choose Us, About, or Contact)",
      status: "success",
    });

    return NextResponse.json({ success: true, content: updated });
  } catch (error) {
    console.error("Admin Content PUT Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update website content" }, { status: 500 });
  }
}
