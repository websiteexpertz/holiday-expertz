import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "../../../../lib/security/adminAuthService";
import { getAllAuditLogs } from "../../../../lib/storage/auditLogStore";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const module = searchParams.get("module") || undefined;
    const adminId = searchParams.get("adminId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100;

    let logs = getAllAuditLogs();
    if (module) {
      logs = logs.filter((l) => l.module === module);
    }
    if (adminId) {
      logs = logs.filter((l) => l.adminId === adminId);
    }
    if (limit) {
      logs = logs.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error("Admin Audit Logs GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch audit logs" }, { status: 500 });
  }
}
