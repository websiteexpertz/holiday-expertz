import crypto from "crypto";
import { PropertyOwner, PropertyOwnerRecord, PropertyOwnerRegistrationInput } from "../../types/auth";
import { hashPassword, verifyPassword } from "../security/passwordHasher";
import {
  createOwner,
  findOwnerByEmail,
  findOwnerByMobile,
  sanitizeOwner,
} from "../storage/propertyOwnerStore";

export type RegistrationResult =
  | { success: true; owner: PropertyOwner; message: string }
  | { success: false; field: "email" | "mobileNumber" | "general"; message: string };

export type AuthenticationResult =
  | { success: true; owner: PropertyOwner; message: string }
  | { success: false; message: string };

/**
 * Service to register a new property owner with conflict checks and secure hashing
 */
export async function registerPropertyOwner(input: PropertyOwnerRegistrationInput): Promise<RegistrationResult> {
  // Check for duplicate email
  if (await findOwnerByEmail(input.email)) {
    return {
      success: false,
      field: "email",
      message: "An account with this email address already exists. Please sign in instead.",
    };
  }

  // Check for duplicate mobile number
  if (await findOwnerByMobile(input.mobileNumber)) {
    return {
      success: false,
      field: "mobileNumber",
      message: "An account with this mobile number is already registered.",
    };
  }

  // Cryptographically hash password
  const { hash, salt } = hashPassword(input.password);
  const now = new Date().toISOString();

  const newRecord: PropertyOwnerRecord = {
    id: `owner_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
    fullName: input.fullName.trim(),
    mobileNumber: input.mobileNumber.trim(),
    email: input.email.toLowerCase().trim(),
    passwordHash: hash,
    passwordSalt: salt,
    role: "property_owner",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  try {
    await createOwner(newRecord);
  } catch (error) {
    const mongoError = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoError.code === 11000) {
      const field = mongoError.keyPattern?.emailNormalized ? "email" : "mobileNumber";
      return {
        success: false,
        field,
        message: field === "email"
          ? "An account with this email address already exists. Please sign in instead."
          : "An account with this mobile number is already registered.",
      };
    }
    throw error;
  }

  return {
    success: true,
    owner: sanitizeOwner(newRecord),
    message: "Property owner account successfully created! Welcome to HolidayExpertz Partner Network.",
  };
}

/**
 * Service to authenticate an owner via email and password
 */
export async function authenticatePropertyOwner(email: string, password: string): Promise<AuthenticationResult> {
  const record = await findOwnerByEmail(email);
  if (!record) {
    return {
      success: false,
      message: "Invalid email address or password.",
    };
  }

  const isValid = verifyPassword(password, record.passwordHash, record.passwordSalt);
  if (!isValid) {
    return {
      success: false,
      message: "Invalid email address or password.",
    };
  }

  return {
    success: true,
    owner: sanitizeOwner(record),
    message: "Successfully signed in!",
  };
}
