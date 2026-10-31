import crypto from "crypto";
import { AdminPermission, AdminUser } from "../../types/admin";
import { findAdminByEmail, findAdminById, hasPermission, getAllAdmins, saveAdmins } from "../storage/adminStore";
import { verifyPasswordAsync } from "./passwordHasher";
import { createAuditLog as recordAuditLog } from "../storage/auditLogStore";

/** Inline helper — updates a single field-set on an admin record */
function updateAdminRecord(id: string, patch: Record<string, unknown>): void {
  const all = getAllAdmins();
  const idx = all.findIndex((a) => a.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
    saveAdmins(all);
  }
}

/** Alias so call sites below resolve */
const getAdminById = findAdminById;

const SESSION_DURATION_HOURS = 24;

interface AdminSessionPayload {
  adminId: string;
  email: string;
  role: string;
  exp: number;
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is required but is not configured.");
  }
  return secret;
}

function signPayload(payloadStr: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payloadStr).digest("base64url");
}

export function createAdminSessionToken(admin: AdminUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_HOURS * 3600;
  const payload: AdminSessionPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    exp,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadStr);
  return `${payloadStr}.${signature}`;
}

export function verifyAdminSessionToken(token: string): { valid: boolean; admin?: AdminUser; error?: string } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, error: "Malformed token structure" };
    }

    const [payloadStr, signature] = parts;
    const expectedSig = signPayload(payloadStr);

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, error: "Invalid token signature" };
    }

    const payload: AdminSessionPayload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: "Session expired" };
    }

    const admin = getAdminById(payload.adminId);
    if (!admin) {
      return { valid: false, error: "Admin account not found" };
    }

    if (admin.status !== "active") {
      return { valid: false, error: "Admin account is suspended" };
    }

    return { valid: true, admin };
  } catch (err) {
    return { valid: false, error: "Failed to verify session token" };
  }
}

export async function loginAdmin(
  email: string,
  pass: string,
  ipAddress?: string
): Promise<{ success: boolean; token?: string; admin?: AdminUser; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const adminRec = findAdminByEmail(normalizedEmail);

  if (!adminRec) {
    return { success: false, error: "Invalid email or password" };
  }

  if (adminRec.status !== "active") {
    return { success: false, error: "Your administrator account has been deactivated" };
  }

  const isPasswordValid = await verifyPasswordAsync(pass, adminRec.passwordHash, adminRec.passwordSalt);
  if (!isPasswordValid) {
    recordAuditLog({
      adminId: adminRec.id,
      adminName: adminRec.fullName,
      adminEmail: adminRec.email,
      module: "admin_management",
      action: "login_failed",
      details: `Failed admin login attempt for ${adminRec.email}`,
      status: "failure",
      ipAddress,
    });
    return { success: false, error: "Invalid email or password" };
  }

  // Update last login timestamp
  updateAdminRecord(adminRec.id, {
    lastLoginAt: new Date().toISOString(),
  });

  const { passwordHash, passwordSalt, ...safeAdmin } = adminRec;
  const token = createAdminSessionToken(safeAdmin);

  recordAuditLog({
    adminId: safeAdmin.id,
    adminName: safeAdmin.fullName,
    adminEmail: safeAdmin.email,
    module: "admin_management",
    action: "login",
    details: `Admin ${safeAdmin.fullName} logged in successfully`,
    status: "success",
    ipAddress,
  });

  return {
    success: true,
    token,
    admin: safeAdmin,
  };
}

export function extractAdminTokenFromRequest(req: Request): string | null {
  // Check Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Check Cookie header: admin_session=<token>
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("admin_session=")) {
        return decodeURIComponent(c.substring("admin_session=".length));
      }
    }
  }

  return null;
}

export function getAuthenticatedAdmin(req: Request): AdminUser | null {
  const token = extractAdminTokenFromRequest(req);
  if (!token) return null;
  const res = verifyAdminSessionToken(token);
  return res.valid && res.admin ? res.admin : null;
}

export function checkAdminPermission(admin: AdminUser, permission: AdminPermission): boolean {
  return hasPermission(admin, permission);
}
