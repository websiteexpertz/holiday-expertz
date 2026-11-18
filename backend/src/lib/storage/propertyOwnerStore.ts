import fs from "fs";
import path from "path";
import { PropertyOwnerRecord, PropertyOwner } from "../../types/auth";
import connectToDatabase from "../db/mongodb";
import { PropertyOwnerModel } from "../models/PropertyOwner";
import { getNextOwnerNumber } from "../services/counterService";

function getOwnersFilePath(): string {
  const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
  return path.join(rootDir, "backend", "src", "data", "propertyOwners.json");
}

function readLocalOwnersFile(): PropertyOwnerRecord[] {
  try {
    const filePath = getOwnersFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to read local propertyOwners file:", err);
  }
  return [];
}

function writeLocalOwnersFile(owners: PropertyOwnerRecord[]): void {
  try {
    const filePath = getOwnersFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(owners, null, 2), "utf-8");
    fs.renameSync(tempFile, filePath);
  } catch (err) {
    console.warn("Failed to write local propertyOwners file:", err);
  }
}

/**
 * Reads all property owner records with caching
 */
export async function getAllOwners(): Promise<PropertyOwnerRecord[]> {
  try {
    await connectToDatabase();
    const owners = await PropertyOwnerModel.find().lean();
    if (owners && owners.length > 0) {
      for (const o of owners) {
        if (!o.ownerNumber) {
          const generated = await getNextOwnerNumber();
          o.ownerNumber = generated;
          try {
            await PropertyOwnerModel.updateOne({ id: o.id }, { $set: { ownerNumber: generated } });
          } catch (e) {
            console.warn("Failed to persist auto-healed ownerNumber:", e);
          }
        }
      }
      return owners.map(toOwnerRecord);
    }
  } catch (err) {
    console.warn("MongoDB getAllOwners fallback to local file:", (err as Error)?.message);
  }
  const local = readLocalOwnersFile();
  for (const o of local) {
    if (!o.ownerNumber) {
      o.ownerNumber = await getNextOwnerNumber();
    }
  }
  return local.map(toOwnerRecord);
}

/**
 * Persists records back to storage using safe temporary file rename
 */
export async function createOwner(owner: PropertyOwnerRecord): Promise<PropertyOwnerRecord> {
  if (!owner.ownerNumber) {
    owner.ownerNumber = await getNextOwnerNumber();
  }
  const image = owner.profileImage ?? owner.avatar ?? null;
  const about = owner.aboutOwner ?? owner.bio ?? "";
  const langs = Array.isArray(owner.languagesSpoken)
    ? Array.from(new Set(owner.languagesSpoken.map((l) => l.trim()).filter(Boolean)))
    : [];

  try {
    await connectToDatabase();
    const created = await PropertyOwnerModel.create({
      ...owner,
      ownerNumber: owner.ownerNumber,
      avatar: image || undefined,
      profileImage: image,
      languagesSpoken: langs,
      aboutOwner: about,
      bio: about,
      email: normalizeEmail(owner.email),
      emailNormalized: normalizeEmail(owner.email),
      mobileNumber: owner.mobileNumber.trim(),
      mobileNormalized: normalizeMobile(owner.mobileNumber),
    });
    const record = toOwnerRecord(created.toObject());
    const local = readLocalOwnersFile().filter((o) => o.id !== record.id);
    local.push(record);
    writeLocalOwnersFile(local);
    return record;
  } catch (err) {
    const record = toOwnerRecord(owner);
    const local = readLocalOwnersFile().filter((o) => o.id !== record.id);
    local.push(record);
    writeLocalOwnersFile(local);
    return record;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeMobile(mobileNumber: string): string {
  return mobileNumber.replace(/\D/g, "");
}

function toOwnerRecord(owner: object): PropertyOwnerRecord {
  const record = owner as unknown as PropertyOwnerRecord;
  const image = record.profileImage ?? record.avatar ?? null;
  const about = record.aboutOwner ?? record.bio ?? "";
  const langs = Array.isArray(record.languagesSpoken) ? record.languagesSpoken : [];

  return {
    id: record.id,
    ownerNumber: record.ownerNumber,
    fullName: record.fullName,
    mobileNumber: record.mobileNumber,
    email: record.email,
    passwordHash: record.passwordHash,
    passwordSalt: record.passwordSalt,
    role: record.role,
    status: record.status,
    avatar: image || undefined,
    profileImage: image,
    languagesSpoken: langs,
    aboutOwner: about,
    businessName: record.businessName,
    address: record.address,
    bio: about,
    altPhone: record.altPhone,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Finds an owner record by email (case-insensitive)
 */
export async function findOwnerByEmail(email: string): Promise<PropertyOwnerRecord | undefined> {
  const normalized = normalizeEmail(email);
  try {
    await connectToDatabase();
    const owner = await PropertyOwnerModel.findOne({ emailNormalized: normalized }).lean();
    if (owner) return toOwnerRecord(owner);
  } catch (err) {
    console.warn("MongoDB findOwnerByEmail warning:", (err as Error)?.message);
  }
  const localMatch = readLocalOwnersFile().find((o) => normalizeEmail(o.email) === normalized);
  return localMatch ? toOwnerRecord(localMatch) : undefined;
}

/**
 * Finds an owner record by mobile number (digits only normalized)
 */
export async function findOwnerByMobile(mobileNumber: string): Promise<PropertyOwnerRecord | undefined> {
  const normalized = normalizeMobile(mobileNumber);
  try {
    await connectToDatabase();
    const owner = await PropertyOwnerModel.findOne({ mobileNormalized: normalized }).lean();
    if (owner) return toOwnerRecord(owner);
  } catch (err) {
    console.warn("MongoDB findOwnerByMobile warning:", (err as Error)?.message);
  }
  const localMatch = readLocalOwnersFile().find((o) => normalizeMobile(o.mobileNumber) === normalized);
  return localMatch ? toOwnerRecord(localMatch) : undefined;
}

/**
 * Finds an owner record by ID
 */
export async function findOwnerById(id: string): Promise<PropertyOwnerRecord | undefined> {
  try {
    await connectToDatabase();
    const owner = await PropertyOwnerModel.findOne({ id }).lean();
    if (owner) return toOwnerRecord(owner);
  } catch (err) {
    console.warn("MongoDB findOwnerById warning:", (err as Error)?.message);
  }
  const localMatch = readLocalOwnersFile().find((o) => o.id === id);
  return localMatch ? toOwnerRecord(localMatch) : undefined;
}

/**
 * Strips password hash and salt from record before returning to clients
 */
export function sanitizeOwner(record: PropertyOwnerRecord): PropertyOwner {
  const {
    id,
    ownerNumber,
    fullName,
    mobileNumber,
    email,
    role,
    status,
    avatar,
    profileImage,
    languagesSpoken,
    aboutOwner,
    businessName,
    address,
    bio,
    altPhone,
    createdAt,
    updatedAt,
  } = record;
  const image = profileImage ?? avatar ?? null;
  const about = aboutOwner ?? bio ?? "";

  return {
    id,
    ownerNumber,
    fullName,
    mobileNumber,
    email,
    role,
    status,
    avatar: image || undefined,
    profileImage: image,
    languagesSpoken: Array.isArray(languagesSpoken) ? languagesSpoken : [],
    aboutOwner: about,
    businessName,
    address,
    bio: about,
    altPhone,
    createdAt,
    updatedAt,
  };
}

/**
 * Updates an owner profile record
 */
export async function updateOwnerProfile(
  id: string,
  updates: Partial<PropertyOwnerRecord>
): Promise<PropertyOwner | null> {
  await connectToDatabase();
  const updatesWithTimestamp: Record<string, unknown> = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  delete updatesWithTimestamp.ownerNumber; // Immutable: prevent manual or client modifications

  if (updates.profileImage !== undefined || updates.avatar !== undefined) {
    const img = updates.profileImage ?? updates.avatar ?? null;
    updatesWithTimestamp.profileImage = img;
    updatesWithTimestamp.avatar = img || "";
  }

  if (updates.aboutOwner !== undefined || updates.bio !== undefined) {
    const text = updates.aboutOwner ?? updates.bio ?? "";
    updatesWithTimestamp.aboutOwner = text;
    updatesWithTimestamp.bio = text;
  }

  if (updates.languagesSpoken !== undefined) {
    const cleanLangs = Array.isArray(updates.languagesSpoken)
      ? Array.from(new Set(updates.languagesSpoken.map((l) => l.trim()).filter(Boolean)))
      : [];
    updatesWithTimestamp.languagesSpoken = cleanLangs;
  }

  if (updates.mobileNumber !== undefined) {
    updatesWithTimestamp.mobileNumber = updates.mobileNumber.trim();
    updatesWithTimestamp.mobileNormalized = normalizeMobile(updates.mobileNumber);
  }

  if (updates.email !== undefined) {
    updatesWithTimestamp.email = normalizeEmail(updates.email);
    updatesWithTimestamp.emailNormalized = normalizeEmail(updates.email);
  }

  try {
    const updated = await PropertyOwnerModel.findOneAndUpdate(
      { id },
      { $set: updatesWithTimestamp },
      { new: true, runValidators: true }
    ).lean();
    if (updated) {
      const record = toOwnerRecord(updated);
      const local = readLocalOwnersFile().map((o) => (o.id === id ? record : o));
      writeLocalOwnersFile(local);
      return sanitizeOwner(record);
    }
  } catch (err) {
    console.warn("MongoDB updateOwnerProfile fallback to local file:", (err as Error)?.message);
  }

  const local = readLocalOwnersFile();
  const idx = local.findIndex((o) => o.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updatesWithTimestamp } as PropertyOwnerRecord;
    writeLocalOwnersFile(local);
    return sanitizeOwner(toOwnerRecord(local[idx]));
  }
  return null;
}

export async function updateOwnerStatus(
  id: string,
  status: "active" | "pending_review" | "suspended"
): Promise<PropertyOwner | null> {
  const updates = { status, updatedAt: new Date().toISOString() };
  try {
    await connectToDatabase();
    const updated = await PropertyOwnerModel.findOneAndUpdate(
      { id },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();
    if (updated) {
      const record = toOwnerRecord(updated);
      const local = readLocalOwnersFile().map((o) => (o.id === id ? record : o));
      writeLocalOwnersFile(local);
      return sanitizeOwner(record);
    }
  } catch (err) {
    console.warn("MongoDB updateOwnerStatus fallback to local file:", (err as Error)?.message);
  }

  const local = readLocalOwnersFile();
  const idx = local.findIndex((o) => o.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates };
    writeLocalOwnersFile(local);
    return sanitizeOwner(toOwnerRecord(local[idx]));
  }
  return null;
}

export async function deleteOwner(id: string): Promise<boolean> {
  let deleted = false;
  try {
    await connectToDatabase();
    const result = await PropertyOwnerModel.deleteOne({ id });
    deleted = result.deletedCount === 1;
  } catch (err) {
    console.warn("MongoDB deleteOwner fallback to local file:", (err as Error)?.message);
  }

  const local = readLocalOwnersFile();
  const filtered = local.filter((o) => o.id !== id);
  if (filtered.length !== local.length) {
    writeLocalOwnersFile(filtered);
    deleted = true;
  }
  return deleted;
}
