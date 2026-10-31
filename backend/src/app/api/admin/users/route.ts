import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllCustomers, updateCustomerStatus } from "../../../../lib/storage/userStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const customers = getAllCustomers();
    return NextResponse.json({ success: true, customers });
  } catch (error) {
    console.error("Admin Users GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "users.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "Customer id and status required" }, { status: 400 });
    }

    const updated = updateCustomerStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Customer not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "owners_and_users",
      action: "update_customer_status",
      resourceId: id,
      resourceType: "customer",
      details: `Updated customer "${updated.fullName}" status to "${status}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    console.error("Admin Users PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update customer" }, { status: 500 });
  }
}
