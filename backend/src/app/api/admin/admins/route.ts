import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllAdmins,
  createAdminUser,
  updateAdminRecord,
  deleteAdminRecord,
  getAdminById,
  PERMISSION_GROUPS,
} from "../../../../lib/storage/adminStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const admins = getAllAdmins();
    return NextResponse.json({
      success: true,
      admins,
      permissionGroups: PERMISSION_GROUPS,
    });
  } catch (error) {
    console.error("Admin Staff GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch admin users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentAdmin = getAuthenticatedAdmin(req);
    if (!currentAdmin || !checkAdminPermission(currentAdmin, "admins.create")) {
      return NextResponse.json({ success: false, message: "Forbidden: Only Super Admins can create admin staff" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, password, role, permissions, avatar } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json({ success: false, message: "Full name, email, and password are required" }, { status: 400 });
    }

    const newAdmin = await createAdminUser({
      fullName,
      email,
      password,
      role: role || "custom_admin",
      permissions: Array.isArray(permissions) ? permissions : [],
      avatar,
      isActive: true,
    });

    recordAuditLog({
      adminId: currentAdmin.id,
      adminName: currentAdmin.fullName,
      adminEmail: currentAdmin.email,
      module: "admin_management",
      action: "create_admin",
      resourceId: newAdmin.id,
      resourceType: "admin",
      details: `Created new admin account for "${newAdmin.fullName}" (${newAdmin.email}) with role "${newAdmin.role}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (error: any) {
    console.error("Admin Staff POST Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to create admin" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const currentAdmin = getAuthenticatedAdmin(req);
    if (!currentAdmin || !checkAdminPermission(currentAdmin, "admins.update_permissions")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Admin ID required" }, { status: 400 });
    }

    const updated = updateAdminRecord(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Admin user not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: currentAdmin.id,
      adminName: currentAdmin.fullName,
      adminEmail: currentAdmin.email,
      module: "admin_management",
      action: "update_admin",
      resourceId: id,
      resourceType: "admin",
      details: `Updated admin profile/permissions for "${updated.fullName}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, admin: updated });
  } catch (error) {
    console.error("Admin Staff PUT Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentAdmin = getAuthenticatedAdmin(req);
    if (!currentAdmin || !checkAdminPermission(currentAdmin, "admins.deactivate")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Admin ID required" }, { status: 400 });
    }

    if (id === currentAdmin.id) {
      return NextResponse.json({ success: false, message: "You cannot delete your own admin account" }, { status: 400 });
    }

    const targetAdmin = getAdminById(id);
    const success = deleteAdminRecord(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Admin not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: currentAdmin.id,
      adminName: currentAdmin.fullName,
      adminEmail: currentAdmin.email,
      module: "admin_management",
      action: "delete_admin",
      resourceId: id,
      resourceType: "admin",
      details: `Deleted admin account "${targetAdmin?.fullName || id}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Admin user deleted successfully" });
  } catch (error) {
    console.error("Admin Staff DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete admin" }, { status: 500 });
  }
}
