import fs from "fs";
import path from "path";
import {
  AdminRecord,
  AdminUser,
  AdminPermission,
  PermissionModuleGroup,
} from "../../types/admin";
import { hashPassword, verifyPasswordAsync } from "../security/passwordHasher";
import { connectToDatabase } from "../db/mongodb";
import { AdminModel } from "../models/Admin";
import defaultAdminsData from "../../data/admins.json";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "admins.json");

let adminsCache: AdminRecord[] | null = null;

export const ALL_PERMISSIONS: AdminPermission[] = [
  "dashboard.view",
  "destinations.view",
  "destinations.create",
  "destinations.update",
  "destinations.delete",
  "properties.view",
  "properties.create",
  "properties.approve",
  "properties.reject",
  "properties.update",
  "properties.delete",
  "properties.publish",
  "owners.view",
  "owners.create",
  "owners.update",
  "owners.suspend",
  "users.view",
  "users.update",
  "users.suspend",
  "bookings.view",
  "bookings.update",
  "bookings.cancel",
  "subscriptions.view",
  "subscriptions.manage",
  "payments.view",
  "payments.refund",
  "blogs.view",
  "blogs.create",
  "blogs.update",
  "blogs.publish",
  "blogs.delete",
  "events.view",
  "events.create",
  "events.update",
  "events.publish",
  "events.delete",
  "handpicked.view",
  "handpicked.manage",
  "deals.view",
  "deals.create",
  "deals.update",
  "deals.publish",
  "deals.delete",
  "content.view",
  "content.update",
  "reviews.view",
  "reviews.moderate",
  "reviews.delete",
  "inquiries.view",
  "inquiries.update",
  "inquiries.delete",
  "media.view",
  "media.upload",
  "media.delete",
  "reports.view",
  "reports.export",
  "admins.view",
  "admins.create",
  "admins.update_permissions",
  "admins.deactivate",
  "audit_logs.view",
  "settings.view",
  "settings.update",
];

export const PERMISSION_MODULE_GROUPS: PermissionModuleGroup[] = [
  {
    id: "dashboard",
    name: "Dashboard & Metrics",
    description: "Access executive KPIs, stats, charts, and activity streams.",
    permissions: [
      { key: "dashboard.view", label: "View Dashboard", description: "View summary statistics and activity feeds." },
    ],
  },
  {
    id: "destinations",
    name: "Destinations (Hierarchy)",
    description: "Manage Countries, States, Cities, and Areas navigation hierarchy.",
    permissions: [
      { key: "destinations.view", label: "View Destinations", description: "Explore the 4-level destination tree." },
      { key: "destinations.create", label: "Create Locations", description: "Add new countries, states, cities, or areas." },
      { key: "destinations.update", label: "Edit Locations", description: "Rename or edit destination metadata." },
      { key: "destinations.delete", label: "Delete Locations", description: "Remove safe, non-dependent destination records." },
    ],
  },
  {
    id: "properties",
    name: "Properties Management",
    description: "Curate, approve, moderate, and edit property listings.",
    permissions: [
      { key: "properties.view", label: "View Properties", description: "Browse all properties and view detail sheets." },
      { key: "properties.create", label: "Create Properties", description: "Add new properties directly under destination hierarchy." },
      { key: "properties.approve", label: "Approve Listings", description: "Approve and activate pending property submissions." },
      { key: "properties.reject", label: "Reject with Reason", description: "Reject submissions with curation guidance feedback." },
      { key: "properties.update", label: "Edit Properties", description: "Modify pricing, amenities, titles, and media." },
      { key: "properties.publish", label: "Publish / Pause", description: "Toggle public visibility of active properties." },
      { key: "properties.delete", label: "Delete Listings", description: "Permanently delete properties with confirmation." },
    ],
  },
  {
    id: "owners_users",
    name: "Owners & Customers",
    description: "Manage host partners and customer accounts.",
    permissions: [
      { key: "owners.view", label: "View Owners", description: "Browse registered property owners and portfolio links." },
      { key: "owners.create", label: "Create Owners", description: "Manually onboard and add new property owners." },
      { key: "owners.update", label: "Edit Owner Status", description: "Update host profiles and verification tags." },
      { key: "owners.suspend", label: "Suspend Owners", description: "Suspend or restore property owner accounts." },
      { key: "users.view", label: "View Customers", description: "View registered travelers and customer profiles." },
      { key: "users.update", label: "Edit Customer Info", description: "Update customer records." },
      { key: "users.suspend", label: "Suspend Customers", description: "Suspend or restore customer access." },
    ],
  },
  {
    id: "bookings_payments",
    name: "Bookings & Payments",
    description: "Track guest stays, transactions, and commission settlements.",
    permissions: [
      { key: "bookings.view", label: "View Bookings", description: "View booking ledger, guest info, and stay dates." },
      { key: "bookings.update", label: "Update Bookings", description: "Modify booking dates or internal booking notes." },
      { key: "bookings.cancel", label: "Cancel Bookings", description: "Cancel reservations with validated reason." },
      { key: "subscriptions.view", label: "View Subscriptions", description: "View partner plans, perks, and host renewals." },
      { key: "subscriptions.manage", label: "Manage Subscriptions", description: "Adjust partner tier perks and commission terms." },
      { key: "payments.view", label: "View Transactions", description: "Audit payment gateways and transaction references." },
      { key: "payments.refund", label: "Process Refunds", description: "Authorize and record verified transaction refunds." },
    ],
  },
  {
    id: "content_curation",
    name: "Editorial & Promotions",
    description: "Manage blogs, upcoming events, handpicked collections, and deals.",
    permissions: [
      { key: "blogs.view", label: "View Blogs", description: "Browse articles, travel stories, and guides." },
      { key: "blogs.create", label: "Write Blogs", description: "Author new blog articles." },
      { key: "blogs.update", label: "Edit Blogs", description: "Edit article content, excerpts, and SEO tags." },
      { key: "blogs.publish", label: "Publish Blogs", description: "Take blog articles live on the public site." },
      { key: "blogs.delete", label: "Delete Blogs", description: "Remove or archive blog posts." },
      { key: "events.view", label: "View Events", description: "Browse festivals, retreats, and cultural events." },
      { key: "events.create", label: "Create Events", description: "Add new regional events." },
      { key: "events.update", label: "Edit Events", description: "Update event schedules, dates, and covers." },
      { key: "events.publish", label: "Publish Events", description: "Show events on public Upcoming Events section." },
      { key: "events.delete", label: "Delete Events", description: "Remove expired or cancelled events." },
      { key: "handpicked.view", label: "View Handpicked", description: "View curated luxury showcase properties." },
      { key: "handpicked.manage", label: "Curate Handpicked", description: "Add/remove and reorder handpicked properties." },
      { key: "deals.view", label: "View Deals", description: "View seasonal offers and discount campaigns." },
      { key: "deals.create", label: "Create Deals", description: "Launch new promotional deals and coupons." },
      { key: "deals.update", label: "Edit Deals", description: "Update discount rates, dates, and terms." },
      { key: "deals.publish", label: "Publish Deals", description: "Show deals on public Deals section." },
      { key: "deals.delete", label: "Delete Deals", description: "Archive or delete deals." },
    ],
  },
  {
    id: "engagement",
    name: "Customer Feedback & Inquiries",
    description: "Manage traveler inquiries and public guest reviews.",
    permissions: [
      { key: "reviews.view", label: "View Reviews", description: "Browse traveler ratings and testimonials." },
      { key: "reviews.moderate", label: "Moderate Reviews", description: "Approve, feature, or hide guest reviews." },
      { key: "reviews.delete", label: "Delete Reviews", description: "Remove spam or offensive reviews." },
      { key: "inquiries.view", label: "View Inquiries", description: "Read guest inquiries and booking questions." },
      { key: "inquiries.update", label: "Resolve Inquiries", description: "Update inquiry status and log admin notes." },
      { key: "inquiries.delete", label: "Delete Inquiries", description: "Archive or remove old inquiries." },
      { key: "media.view", label: "View Media", description: "Browse uploaded images and visual assets." },
      { key: "media.upload", label: "Upload Media", description: "Upload new photography assets." },
      { key: "media.delete", label: "Delete Media", description: "Remove unused visual media assets." },
    ],
  },
  {
    id: "system",
    name: "System & Administration",
    description: "Super Admin privileges: manage staff admins, audit trails, and site config.",
    permissions: [
      { key: "reports.view", label: "View Reports", description: "Generate business intelligence and growth reports." },
      { key: "reports.export", label: "Export Data", description: "Download CSV / JSON business intelligence summaries." },
      { key: "admins.view", label: "View Admin Staff", description: "List all administrative users." },
      { key: "admins.create", label: "Create Admin", description: "Invite new admins with custom permission sets." },
      { key: "admins.update_permissions", label: "Assign Permissions", description: "Modify assigned RBAC privileges." },
      { key: "admins.deactivate", label: "Deactivate Admin", description: "Suspend or revoke administrative access." },
      { key: "audit_logs.view", label: "View Audit Logs", description: "Inspect immutable security and action trails." },
      { key: "content.view", label: "View Web Content", description: "Inspect hero, banners, and footer content." },
      { key: "content.update", label: "Update Web Content", description: "Modify homepage copy, why choose us, and banners." },
      { key: "settings.view", label: "View Site Settings", description: "Inspect system configurations and SEO defaults." },
      { key: "settings.update", label: "Update Settings", description: "Modify branding, contact info, and feature flags." },
    ],
  },
];

function ensureStorageExists(): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultAdminsData, null, 2), "utf-8");
    }
  } catch {
    // Read-only filesystem in serverless environments (e.g. Vercel)
  }
}

export function getAllAdmins(): AdminRecord[] {
  if (adminsCache !== null && adminsCache.length > 0) {
    return adminsCache;
  }

  try {
    ensureStorageExists();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        adminsCache = parsed;
        return adminsCache;
      }
    }
  } catch {
    // Filesystem read failed on serverless
  }

  adminsCache = Array.isArray(defaultAdminsData) ? (defaultAdminsData as AdminRecord[]) : [];
  return adminsCache;
}

export function saveAdmins(admins: AdminRecord[]): void {
  adminsCache = admins;
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(admins, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
  } catch {
    // Read-only filesystem on Vercel; in-memory cache is updated
  }

  // Asynchronously synchronize with MongoDB
  connectToDatabase()
    .then(async () => {
      for (const a of admins) {
        await AdminModel.findOneAndUpdate({ id: a.id }, a, { upsert: true });
      }
    })
    .catch((err) => {
      console.warn("MongoDB background admin sync error:", err?.message);
    });
}

export function sanitizeAdminUser(admin: AdminRecord): AdminUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, passwordSalt, ...safe } = admin;
  return safe;
}

export function findAdminByEmail(email: string): AdminRecord | null {
  const admins = getAllAdmins();
  return admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export async function findAdminByEmailAsync(email: string): Promise<AdminRecord | null> {
  const normalized = email.trim().toLowerCase();
  try {
    await connectToDatabase();
    const doc = await AdminModel.findOne({ email: normalized }).lean();
    if (doc) {
      return doc as unknown as AdminRecord;
    }
  } catch {
    // Fall back to memory/bundled JSON
  }
  return findAdminByEmail(normalized);
}

export function findAdminById(id: string): AdminRecord | null {
  const admins = getAllAdmins();
  return admins.find((a) => a.id === id) || null;
}

export async function findAdminByIdAsync(id: string): Promise<AdminRecord | null> {
  try {
    await connectToDatabase();
    const doc = await AdminModel.findOne({ id }).lean();
    if (doc) {
      return doc as unknown as AdminRecord;
    }
  } catch {
    // Fall back to memory/bundled JSON
  }
  return findAdminById(id);
}

export async function authenticateAdmin(
  email: string,
  plainPassword: string
): Promise<{ success: boolean; admin?: AdminUser; message?: string }> {
  const admin = findAdminByEmail(email);
  if (!admin) {
    return { success: false, message: "Invalid administrator credentials." };
  }

  if (admin.status !== "active") {
    return { success: false, message: "Administrator account is inactive or suspended." };
  }

  const isValid = await verifyPasswordAsync(plainPassword, admin.passwordHash, admin.passwordSalt);
  if (!isValid) {
    return { success: false, message: "Invalid administrator credentials." };
  }

  // Update last login
  admin.lastLoginAt = new Date().toISOString();
  admin.updatedAt = new Date().toISOString();
  saveAdmins(getAllAdmins());

  return { success: true, admin: sanitizeAdminUser(admin) };
}

export function hasPermission(admin: AdminUser | AdminRecord, permission: AdminPermission): boolean {
  if (admin.role === "super_admin") {
    return true;
  }
  // Support both exact permission keys and "module.action" style used by some routes
  return admin.permissions.some(
    (p) => p === permission || p.replace("_", ".") === permission || p === permission.replace(".", "_")
  );
}

/** Alias used by route handlers */
export const PERMISSION_GROUPS = PERMISSION_MODULE_GROUPS;

/** Get admin by ID (alias for findAdminById) */
export function getAdminById(id: string): AdminRecord | null {
  return findAdminById(id);
}

/** Update a specific admin record by ID */
export function updateAdminRecord(
  id: string,
  updates: Partial<Omit<AdminRecord, "id" | "createdAt">>
): AdminUser | null {
  const all = getAllAdmins();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAdmins(all);
  return sanitizeAdminUser(all[idx]);
}

/** Delete an admin record by ID. Returns false if not found. */
export function deleteAdminRecord(id: string): boolean {
  const all = getAllAdmins();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  saveAdmins(all);
  return true;
}

/** Create a new admin user. Throws if email already exists. */
export async function createAdminUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: "super_admin" | "custom_admin";
  permissions: AdminPermission[];
  avatar?: string;
  department?: string;
  isActive?: boolean;
}): Promise<AdminUser> {
  const existing = findAdminByEmail(input.email);
  if (existing) {
    throw new Error(`An admin with email "${input.email}" already exists.`);
  }

  const { hash, salt } = hashPassword(input.password);
  const newAdmin: AdminRecord = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    permissions: input.permissions,
    status: input.isActive !== false ? "active" : "inactive",
    avatar: input.avatar,
    department: input.department,
    passwordHash: hash,
    passwordSalt: salt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const all = getAllAdmins();
  all.push(newAdmin);
  saveAdmins(all);
  return sanitizeAdminUser(newAdmin);
}
