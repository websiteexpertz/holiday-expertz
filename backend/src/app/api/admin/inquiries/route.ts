import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllInquiries, updateInquiry, deleteInquiry, getInquiryById } from "../../../../lib/storage/inquiryStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    let inquiries = getAllInquiries();

    if (status && status !== "all") {
      inquiries = inquiries.filter((i) => i.status === status);
    }

    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    console.error("Admin Inquiries GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch inquiries" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "inquiries.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Inquiry ID required" }, { status: 400 });
    }

    const updated = updateInquiry(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Inquiry not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "contact_inquiries",
      action: "update_inquiry",
      resourceId: id,
      resourceType: "inquiry",
      details: `Updated inquiry from "${updated.name}" to status ${updated.status}`,
      status: "success",
    });

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("Admin Inquiries PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update inquiry" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "inquiries.delete")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Inquiry ID required" }, { status: 400 });
    }

    const inq = getInquiryById(id);
    const success = deleteInquiry(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Inquiry not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "contact_inquiries",
      action: "delete_inquiry",
      resourceId: id,
      resourceType: "inquiry",
      details: `Deleted contact inquiry from "${inq?.name || id}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Admin Inquiries DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete inquiry" }, { status: 500 });
  }
}
