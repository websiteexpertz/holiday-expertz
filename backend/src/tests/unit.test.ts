import assert from "node:assert/strict";
import { hashPasswordAsync, verifyPasswordAsync, hashPassword } from "../lib/security/passwordHasher";
import { createAdminSessionToken, verifyAdminSessionToken } from "../lib/security/adminAuthService";
import { validateOwnerRegistration } from "../lib/validators/authValidators";
import { getPropertyCoordinates } from "../../../frontend/src/utils/propertyCoordinates";
import { getPublicApprovedProperties, getAllProperties } from "../lib/storage/propertyStore";
import { getAllAdmins } from "../lib/storage/adminStore";

interface TestReportItem {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const reports: TestReportItem[] = [];

async function test(id: number, category: string, name: string, fn: () => Promise<void> | void) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    reports.push({ id, name, category, passed: true, durationMs: duration });
    console.log(`  ✅ [${category}] #${id}: ${name} (${duration}ms)`);
  } catch (err: any) {
    const duration = Date.now() - start;
    reports.push({ id, name, category, passed: false, durationMs: duration, error: err?.message });
    console.log(`  ❌ [${category}] #${id}: ${name} -> FAILED: ${err?.message}`);
  }
}

export async function runUnitTests(): Promise<boolean> {
  console.log("==========================================================");
  console.log("🧪 RUNNING UNIT TESTS (HolidayExpertz Engine)");
  console.log("==========================================================\n");

  // ── GROUP 1: Security & Cryptography ──
  console.log("--- Group 1: Security & Cryptography ---");

  await test(1, "Crypto", "hashPasswordAsync generates salt and non-empty hex hash", async () => {
    const res = await hashPasswordAsync("AdminSecret123!");
    assert.ok(res.salt && res.salt.length === 32, "Salt should be 32 hex chars (16 bytes)");
    assert.ok(res.hash && res.hash.length === 128, "Scrypt derived key should be 128 hex chars (64 bytes)");
  });

  await test(2, "Crypto", "verifyPasswordAsync returns true for matching password", async () => {
    const { hash, salt } = await hashPasswordAsync("CorrectPassword#2026");
    const isValid = await verifyPasswordAsync("CorrectPassword#2026", hash, salt);
    assert.strictEqual(isValid, true, "Should return true for correct password");
  });

  await test(3, "Crypto", "verifyPasswordAsync returns false for wrong password", async () => {
    const { hash, salt } = await hashPasswordAsync("CorrectPassword#2026");
    const isValid = await verifyPasswordAsync("WrongPassword#9999", hash, salt);
    assert.strictEqual(isValid, false, "Should return false for incorrect password");
  });

  await test(4, "Crypto", "Synchronous hashPassword generates valid scrypt result", () => {
    const res = hashPassword("SyncPassword123");
    assert.ok(res.hash && res.salt, "Sync hash should have hash and salt");
  });

  await test(5, "Auth", "createAdminSessionToken creates signed 2-part base64url token", () => {
    const admins = getAllAdmins();
    const admin = admins[0];
    assert.ok(admin, "An admin must exist in store");
    const token = createAdminSessionToken(admin);
    const parts = token.split(".");
    assert.strictEqual(parts.length, 2, "Token should consist of payload.signature");
  });

  await test(6, "Auth", "verifyAdminSessionToken validates authentic token and returns admin object", () => {
    const admins = getAllAdmins();
    const admin = admins[0];
    const token = createAdminSessionToken(admin);
    const res = verifyAdminSessionToken(token);
    assert.strictEqual(res.valid, true, "Token verification should be valid");
    assert.strictEqual(res.admin?.id, admin.id, "Admin ID in token should match");
  });

  await test(7, "Auth", "verifyAdminSessionToken rejects tampered token signature", () => {
    const admins = getAllAdmins();
    const admin = admins[0];
    const token = createAdminSessionToken(admin);
    // Tamper with the signature portion
    const [payload, sig] = token.split(".");
    const tamperedSig = sig.slice(0, -2) + (sig.slice(-2) === "AA" ? "BB" : "AA");
    const tamperedToken = `${payload}.${tamperedSig}`;
    const res = verifyAdminSessionToken(tamperedToken);
    assert.strictEqual(res.valid, false, "Tampered signature must be rejected");
  });

  await test(8, "Auth", "verifyAdminSessionToken rejects malformed token", () => {
    const res = verifyAdminSessionToken("not-a-valid-token-string");
    assert.strictEqual(res.valid, false, "Malformed string should be rejected");
  });

  // ── GROUP 2: Registration & Form Validators ──
  console.log("\n--- Group 2: Registration & Form Validators ---");

  await test(9, "Validator", "validateOwnerRegistration passes valid owner data", () => {
    const validPayload = {
      fullName: "Vikram Singhania",
      mobileNumber: "9876543210",
      email: "vikram@holidayexpertz.com",
      password: "StrongPassword@123",
      confirmPassword: "StrongPassword@123",
    };
    const res = validateOwnerRegistration(validPayload);
    assert.strictEqual(res.isValid, true, "Valid owner registration should pass");
    assert.strictEqual(Object.keys(res.errors).length, 0, "No errors should be reported");
    assert.strictEqual(res.cleanedData?.email, "vikram@holidayexpertz.com");
  });

  await test(10, "Validator", "validateOwnerRegistration catches invalid email format", () => {
    const payload = {
      fullName: "Vikram Singhania",
      mobileNumber: "9876543210",
      email: "invalid-email-without-at",
      password: "StrongPassword@123",
      confirmPassword: "StrongPassword@123",
    };
    const res = validateOwnerRegistration(payload);
    assert.strictEqual(res.isValid, false, "Should be invalid");
    assert.ok(res.errors.email, "Error should exist on email field");
  });

  await test(11, "Validator", "validateOwnerRegistration catches invalid phone number", () => {
    const payload = {
      fullName: "Vikram Singhania",
      mobileNumber: "123", // too short
      email: "vikram@holidayexpertz.com",
      password: "StrongPassword@123",
      confirmPassword: "StrongPassword@123",
    };
    const res = validateOwnerRegistration(payload);
    assert.strictEqual(res.isValid, false, "Should be invalid");
    assert.ok(res.errors.mobileNumber, "Error should exist on mobileNumber field");
  });

  await test(12, "Validator", "validateOwnerRegistration catches password mismatch", () => {
    const payload = {
      fullName: "Vikram Singhania",
      mobileNumber: "9876543210",
      email: "vikram@holidayexpertz.com",
      password: "StrongPassword@123",
      confirmPassword: "DifferentPassword@456",
    };
    const res = validateOwnerRegistration(payload);
    assert.strictEqual(res.isValid, false, "Should be invalid");
    assert.ok(res.errors.confirmPassword, "Error should exist on confirmPassword field");
  });

  await test(13, "Validator", "validateOwnerRegistration catches password < 8 characters", () => {
    const payload = {
      fullName: "Vikram Singhania",
      mobileNumber: "9876543210",
      email: "vikram@holidayexpertz.com",
      password: "short",
      confirmPassword: "short",
    };
    const res = validateOwnerRegistration(payload);
    assert.strictEqual(res.isValid, false, "Should be invalid");
    assert.ok(res.errors.password, "Error should exist on password length");
  });

  // ── GROUP 3: Geolocation & Coordinate Engine ──
  console.log("\n--- Group 3: Geolocation & Coordinate Engine ---");

  await test(14, "Geo", "getPropertyCoordinates extracts explicit coordinates when present", () => {
    const mockProperty: any = {
      id: "test_prop_01",
      name: "Villa Azure",
      location: {
        city: "Anjuna",
        country: "India",
        coordinates: { latitude: 15.584, longitude: 73.742 },
      },
    };
    const coords = getPropertyCoordinates(mockProperty);
    assert.strictEqual(coords.lat, 15.584);
    assert.strictEqual(coords.lng, 73.742);
  });

  await test(15, "Geo", "getPropertyCoordinates resolves known city coordinates when explicit absent", () => {
    const mockProperty: any = {
      id: "test_prop_02",
      name: "Mountain Lodge",
      location: {
        city: "Zermatt",
        country: "Switzerland",
      },
    };
    const coords = getPropertyCoordinates(mockProperty);
    assert.ok(coords.lat >= 45.0 && coords.lat <= 47.0, `Zermatt latitude should be around 45.97: got ${coords.lat}`);
    assert.ok(coords.lng >= 7.0 && coords.lng <= 8.5, `Zermatt longitude should be around 7.74: got ${coords.lng}`);
  });

  await test(16, "Geo", "getPropertyCoordinates applies deterministic pin jitter offset for distinct IDs", () => {
    const propA: any = { id: "prop_A", location: { city: "Goa" } };
    const propB: any = { id: "prop_B", location: { city: "Goa" } };
    const coordsA = getPropertyCoordinates(propA);
    const coordsB = getPropertyCoordinates(propB);
    assert.notStrictEqual(coordsA.lat, coordsB.lat, "Pins in same city should have slight deterministic offset");
  });

  // ── GROUP 4: Storage & Caching Consistency ──
  console.log("\n--- Group 4: Storage & Caching Consistency ---");

  await test(17, "Storage", "getAllProperties returns an array of valid properties", () => {
    const properties = getAllProperties();
    assert.ok(Array.isArray(properties), "Must return array");
    assert.ok(properties.length > 0, "Should contain seeded properties");
    for (const p of properties) {
      assert.ok(p.id, "Property must have ID");
      assert.ok(p.name, "Property must have name");
      assert.ok(p.location, "Property must have location object");
    }
  });

  await test(18, "Storage", "getPublicApprovedProperties only returns approved properties", () => {
    const approved = getPublicApprovedProperties();
    assert.ok(approved.length > 0, "Approved properties must not be empty");
    for (const p of approved) {
      assert.strictEqual(p.status, "approved", `Property ${p.id} must have status approved`);
    }
  });

  console.log("\n==========================================================");
  const total = reports.length;
  const passedCount = reports.filter((r) => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`📊 UNIT TEST REPORT: ${passedCount}/${total} PASSED`);

  if (failedCount > 0) {
    console.log(`❌ ${failedCount} Unit Tests Failed`);
    return false;
  } else {
    console.log("🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!");
    return true;
  }
}

if (require.main === module || process.argv[1]?.endsWith("unit.test.ts")) {
  runUnitTests()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error("FATAL ERROR IN UNIT TESTS:", err);
      process.exit(1);
    });
}
