import fs from "fs";
import path from "path";
import { PropertyOwnerRecord, PropertyOwner } from "../../types/auth";

// Path resolution: locate backend/src/data/propertyOwners.json from either root or frontend cwd
const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "propertyOwners.json");

// In-memory cache to guarantee fast access and atomic reads
let ownersCache: PropertyOwnerRecord[] | null = null;

/**
 * Ensures data directory and JSON store exist
 */
function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

/**
 * Reads all property owner records with caching
 */
export function getAllOwners(): PropertyOwnerRecord[] {
  if (ownersCache !== null) {
    return ownersCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    ownersCache = Array.isArray(parsed) ? parsed : [];
    return ownersCache;
  } catch (error) {
    console.error("Backend Storage Error: Failed to read property owners store:", error);
    ownersCache = [];
    return ownersCache;
  }
}

/**
 * Persists records back to storage using safe temporary file rename
 */
export function saveOwners(owners: PropertyOwnerRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(owners, null, 2);

    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);

    ownersCache = owners;
  } catch (error) {
    console.error("Backend Storage Error: Failed to persist property owners:", error);
    throw new Error("Failed to persist property owner record to storage.");
  }
}

/**
 * Finds an owner record by email (case-insensitive)
 */
export function findOwnerByEmail(email: string): PropertyOwnerRecord | undefined {
  const normalized = email.toLowerCase().trim();
  const owners = getAllOwners();
  return owners.find((owner) => owner.email.toLowerCase() === normalized);
}

/**
 * Finds an owner record by mobile number (digits only normalized)
 */
export function findOwnerByMobile(mobileNumber: string): PropertyOwnerRecord | undefined {
  const normalized = mobileNumber.replace(/\D/g, "");
  const owners = getAllOwners();
  return owners.find((owner) => owner.mobileNumber.replace(/\D/g, "") === normalized);
}

/**
 * Finds an owner record by ID
 */
export function findOwnerById(id: string): PropertyOwnerRecord | undefined {
  const owners = getAllOwners();
  return owners.find((owner) => owner.id === id);
}

/**
 * Strips password hash and salt from record before returning to clients
 */
export function sanitizeOwner(record: PropertyOwnerRecord): PropertyOwner {
  const {
    id,
    fullName,
    mobileNumber,
    email,
    role,
    status,
    avatar,
    businessName,
    address,
    bio,
    altPhone,
    createdAt,
    updatedAt,
  } = record;
  return {
    id,
    fullName,
    mobileNumber,
    email,
    role,
    status,
    avatar,
    businessName,
    address,
    bio,
    altPhone,
    createdAt,
    updatedAt,
  };
}

/**
 * Updates an owner profile record
 */
export function updateOwnerProfile(
  id: string,
  updates: Partial<Pick<PropertyOwner, "fullName" | "mobileNumber" | "avatar" | "businessName" | "address" | "bio" | "altPhone">>
): PropertyOwner | null {
  const owners = getAllOwners();
  const index = owners.findIndex((o) => o.id === id);
  if (index === -1) return null;

  const current = owners[index];
  const updatedRecord: PropertyOwnerRecord = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  owners[index] = updatedRecord;
  saveOwners(owners);
  return sanitizeOwner(updatedRecord);
}

export function updateOwnerStatus(
  id: string,
  status: "active" | "pending_review" | "suspended"
): PropertyOwner | null {
  const owners = getAllOwners();
  const index = owners.findIndex((o) => o.id === id);
  if (index === -1) return null;

  owners[index] = {
    ...owners[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  saveOwners(owners);
  return sanitizeOwner(owners[index]);
}

export function deleteOwner(id: string): boolean {
  const owners = getAllOwners();
  const index = owners.findIndex((o) => o.id === id);
  if (index === -1) return false;

  owners.splice(index, 1);
  saveOwners(owners);
  return true;
}
