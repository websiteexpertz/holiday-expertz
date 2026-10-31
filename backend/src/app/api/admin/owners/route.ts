import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllOwners,
  updateOwnerStatus,
  deleteOwner,
  findOwnerByEmail,
  findOwnerByMobile,
  createOwner,
  sanitizeOwner,
} from "../../../../lib/storage/propertyOwnerStore";
import { hashPassword } from "../../../../lib/security/passwordHasher";
import { PropertyOwnerRecord } from "../../../../types/auth";
import { getPropertiesByOwnerId } from "../../../../lib/storage/propertyStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const owners = await getAllOwners();
    const enriched = owners.map((owner) => {
      const properties = getPropertiesByOwnerId(owner.id);
      return {
        id: owner.id,
        fullName: owner.fullName,
        email: owner.email,
        mobileNumber: owner.mobileNumber,
        businessName: owner.businessName,
        status: owner.status,
        avatar: owner.avatar,
        propertiesCount: properties.length,
        publishedCount: properties.filter((p) => p.status === "approved").length,
        createdAt: owner.createdAt,
      };
    });

    return NextResponse.json({ success: true, owners: enriched });
  } catch (error) {
    console.error("Admin Owners GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch owners" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "owners.create")) {
      return NextResponse.json({ success: false, message: "Forbidden: Insufficient privileges" }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, mobileNumber, password, businessName, status, address, bio, altPhone } = body;

    if (!fullName?.trim() || !email?.trim() || !mobileNumber?.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name, email address, and mobile number are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ success: false, message: "Invalid email address format" }, { status: 400 });
    }

    if (await findOwnerByEmail(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "An owner with this email address already exists" },
        { status: 409 }
      );
    }

    const normalizedMobile = mobileNumber.replace(/\D/g, "");
    if (normalizedMobile.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    if (await findOwnerByMobile(normalizedMobile)) {
      return NextResponse.json(
        { success: false, message: "An owner with this mobile number already exists" },
        { status: 409 }
      );
    }

    const effectivePassword = password?.trim() || "Owner@HolidayExpertz2026!";
    const { hash, salt } = hashPassword(effectivePassword);
    const now = new Date().toISOString();

    const newOwner: PropertyOwnerRecord = {
      id: `owner_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobileNumber: mobileNumber.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      role: "property_owner",
      status: status || "active",
      businessName: businessName?.trim() || "",
      address: address?.trim() || "",
      bio: bio?.trim() || "",
      altPhone: altPhone?.trim() || "",
      createdAt: now,
      updatedAt: now,
    };

    await createOwner(newOwner);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "owners_and_users",
      action: "create_owner",
      resourceId: newOwner.id,
      resourceType: "owner",
      details: `Admin created owner "${newOwner.fullName}" (${newOwner.email}) with status "${newOwner.status}"`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      owner: sanitizeOwner(newOwner),
      tempPassword: password?.trim() ? undefined : effectivePassword,
      message: "Property owner successfully created!",
    });
  } catch (error) {
    console.error("Admin Owners POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create owner" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "owners.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "Owner id and status required" }, { status: 400 });
    }

    const updated = await updateOwnerStatus(id, status);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Owner not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "owners_and_users",
      action: "update_owner_status",
      resourceId: id,
      resourceType: "owner",
      details: `Updated owner "${updated.fullName}" status to "${status}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, owner: updated });
  } catch (error) {
    console.error("Admin Owners PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update owner" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "owners.suspend")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Owner id required" }, { status: 400 });
    }

    const success = await deleteOwner(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Owner not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "owners_and_users",
      action: "delete_owner",
      resourceId: id,
      resourceType: "owner",
      details: `Deleted owner record ${id}`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Owner deleted successfully" });
  } catch (error) {
    console.error("Admin Owners DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete owner" }, { status: 500 });
  }
}
