import { PropertyOwnerRecord, PropertyOwner } from "../../types/auth";
import connectToDatabase from "../db/mongodb";
import { PropertyOwnerModel } from "../models/PropertyOwner";

/**
 * Reads all property owner records with caching
 */
export async function getAllOwners(): Promise<PropertyOwnerRecord[]> {
  await connectToDatabase();
  const owners = await PropertyOwnerModel.find().lean();
  return owners.map(toOwnerRecord);
}

/**
 * Persists records back to storage using safe temporary file rename
 */
export async function createOwner(owner: PropertyOwnerRecord): Promise<PropertyOwnerRecord> {
  await connectToDatabase();
  const created = await PropertyOwnerModel.create({
    ...owner,
    email: normalizeEmail(owner.email),
    emailNormalized: normalizeEmail(owner.email),
    mobileNumber: owner.mobileNumber.trim(),
    mobileNormalized: normalizeMobile(owner.mobileNumber),
  });
  return toOwnerRecord(created.toObject());
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeMobile(mobileNumber: string): string {
  return mobileNumber.replace(/\D/g, "");
}

function toOwnerRecord(owner: object): PropertyOwnerRecord {
  const record = owner as unknown as PropertyOwnerRecord;
  return {
    id: record.id,
    fullName: record.fullName,
    mobileNumber: record.mobileNumber,
    email: record.email,
    passwordHash: record.passwordHash,
    passwordSalt: record.passwordSalt,
    role: record.role,
    status: record.status,
    avatar: record.avatar,
    businessName: record.businessName,
    address: record.address,
    bio: record.bio,
    altPhone: record.altPhone,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Finds an owner record by email (case-insensitive)
 */
export async function findOwnerByEmail(email: string): Promise<PropertyOwnerRecord | undefined> {
  await connectToDatabase();
  const owner = await PropertyOwnerModel.findOne({ emailNormalized: normalizeEmail(email) }).lean();
  return owner ? toOwnerRecord(owner) : undefined;
}

/**
 * Finds an owner record by mobile number (digits only normalized)
 */
export async function findOwnerByMobile(mobileNumber: string): Promise<PropertyOwnerRecord | undefined> {
  await connectToDatabase();
  const owner = await PropertyOwnerModel.findOne({ mobileNormalized: normalizeMobile(mobileNumber) }).lean();
  return owner ? toOwnerRecord(owner) : undefined;
}

/**
 * Finds an owner record by ID
 */
export async function findOwnerById(id: string): Promise<PropertyOwnerRecord | undefined> {
  await connectToDatabase();
  const owner = await PropertyOwnerModel.findOne({ id }).lean();
  return owner ? toOwnerRecord(owner) : undefined;
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
export async function updateOwnerProfile(
  id: string,
  updates: Partial<Pick<PropertyOwner, "fullName" | "mobileNumber" | "avatar" | "businessName" | "address" | "bio" | "altPhone">>
): Promise<PropertyOwner | null> {
  await connectToDatabase();
  const updatesWithTimestamp: Record<string, unknown> = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  if (updates.mobileNumber !== undefined) {
    updatesWithTimestamp.mobileNumber = updates.mobileNumber.trim();
    updatesWithTimestamp.mobileNormalized = normalizeMobile(updates.mobileNumber);
  }
  const updated = await PropertyOwnerModel.findOneAndUpdate(
    { id },
    { $set: updatesWithTimestamp },
    { new: true, runValidators: true }
  ).lean();
  return updated ? sanitizeOwner(toOwnerRecord(updated)) : null;
}

export async function updateOwnerStatus(
  id: string,
  status: "active" | "pending_review" | "suspended"
): Promise<PropertyOwner | null> {
  await connectToDatabase();
  const updated = await PropertyOwnerModel.findOneAndUpdate(
    { id },
    { $set: { status, updatedAt: new Date().toISOString() } },
    { new: true, runValidators: true }
  ).lean();
  return updated ? sanitizeOwner(toOwnerRecord(updated)) : null;
}

export async function deleteOwner(id: string): Promise<boolean> {
  await connectToDatabase();
  const result = await PropertyOwnerModel.deleteOne({ id });
  return result.deletedCount === 1;
}
