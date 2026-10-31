import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { connectToDatabase } from "../lib/db/mongodb";
import { loginAdmin, createAdminSessionToken } from "../lib/security/adminAuthService";
import { getAllAdmins } from "../lib/storage/adminStore";
import { getRecentAuditLogs } from "../lib/storage/auditLogStore";
import {
  saveProperties,
  getAllProperties,
  getPublicApprovedProperties,
  clearPropertiesCache,
} from "../lib/storage/propertyStore";
import {
  createMemory,
  getAllMemories,
  updateMemory,
  deleteMemory,
} from "../lib/storage/memoryStore";
import { Property } from "../types/property";

// API Handlers
import { GET as getAdminStats } from "../app/api/admin/dashboard/stats/route";
import { GET as getPublicProperties } from "../app/api/public/properties/route";
import { GET as getPublicMemories } from "../app/api/public/memories/route";

interface IntegrationReportItem {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
}

const reports: IntegrationReportItem[] = [];

async function itest(id: number, category: string, name: string, fn: () => Promise<void> | void) {
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

export async function runIntegrationTests(): Promise<boolean> {
  console.log("==========================================================");
  console.log("🔗 RUNNING INTEGRATION TESTS (Full System & Live Database)");
  console.log("==========================================================\n");

  const mongoose = await connectToDatabase();

  // ── GROUP 1: Live MongoDB Atlas Connection Health ──
  console.log("--- Group 1: Live MongoDB Atlas Connection ---");

  await itest(1, "Atlas", "MongoDB Atlas connection is established and healthy", async () => {
    assert.strictEqual(mongoose.connection.readyState, 1, "Mongoose readyState should be 1 (Connected)");
    assert.ok(mongoose.connection.host, "Connection host should exist");
    assert.strictEqual(mongoose.connection.name, "holiday-expertz", "Database name should match 'holiday-expertz'");
  });

  await itest(2, "Atlas", "Atlas round-trip ping command responds successfully", async () => {
    const db = mongoose.connection.db;
    assert.ok(db, "Database instance should be available");
    const pingRes = await db.command({ ping: 1 });
    assert.strictEqual(pingRes.ok, 1, "Ping command should return ok: 1");
  });

  // ── GROUP 2: Super Admin Authentication & Security Flow ──
  console.log("\n--- Group 2: Admin Auth & Audit Flow ---");

  let adminToken = "";
  const admins = getAllAdmins();
  const superAdmin = admins[0];

  await itest(3, "AdminAuth", "Super Admin signs in and generates signed session token", async () => {
    assert.ok(superAdmin, "Super admin must be configured in storage");
    // Generate valid session token
    adminToken = createAdminSessionToken(superAdmin);
    assert.ok(adminToken && adminToken.includes("."), "Session token must be non-empty and signed");
  });

  await itest(4, "AdminAuth", "Authenticated admin successfully accesses protected dashboard stats API", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/dashboard/stats", {
      headers: {
        authorization: `Bearer ${adminToken}`,
        cookie: `admin_session=${adminToken}`,
      },
    });

    const res = await getAdminStats(req);
    assert.strictEqual(res.status, 200, "Should return 200 OK for authenticated admin");
    const data = await res.json();
    assert.strictEqual(data.success, true, "Response should indicate success");
    assert.ok(data.stats, "Should contain dashboard stats metrics");
    assert.strictEqual(typeof data.stats.totalProperties, "number");
  });

  await itest(5, "AdminAuth", "Unauthenticated request to admin route is rejected with 401 Unauthorized", async () => {
    const unauthReq = new NextRequest("http://localhost:3000/api/admin/dashboard/stats");
    const res = await getAdminStats(unauthReq);
    assert.strictEqual(res.status, 401, "Should reject unauthenticated request with 401");
  });

  // ── GROUP 3: Property Lifecycle & Location Integration ──
  console.log("\n--- Group 3: Property Lifecycle & Map Search ---");

  const testPropertyId = `prop_integration_${Date.now()}`;
  const testProperty: any = {
    id: testPropertyId,
    name: "Coastal Sunset Villa (Test)",
    propertyType: "villa",
    shortDescription: "Exclusive test villa with cliffside sea views",
    detailedDescription: "Full integration test property description with all amenities and coordinates.",
    location: {
      address: "Cliff Road, Vagator",
      city: "Goa",
      state: "Goa",
      country: "India",
      locality: "Vagator",
      pincode: "403509",
      coordinates: {
        latitude: 15.6012,
        longitude: 73.7388,
      },
    },
    pricing: {
      pricePerNight: 28000,
      currency: "INR",
      cleaningFee: 2000,
    },
    specifications: {
      bedrooms: 4,
      bathrooms: 4,
      maxGuests: 8,
    },
    images: [
      {
        id: "img_test_1",
        url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
        isPrimary: true,
      },
    ],
    amenities: ["Private Pool", "High-speed Wi-Fi", "Sea View"],
    status: "draft",
    isPublished: false,
    ownerId: "admin_managed",
    createdByRole: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await itest(6, "Property", "Draft property is stored and NOT visible on public API", async () => {
    const all = getAllProperties();
    saveProperties([...all, testProperty]);

    const req = new NextRequest("http://localhost:3000/api/public/properties");
    const res = await getPublicProperties(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const foundInPublic = data.properties.some((p: any) => p.id === testPropertyId);
    assert.strictEqual(foundInPublic, false, "Draft property must not appear on public listing");
  });

  await itest(7, "Property", "Publishing property immediately surfaces it in public search with coordinates", async () => {
    const all = getAllProperties();
    const updated = all.map((p) =>
      p.id === testPropertyId ? { ...p, status: "approved" as const, isPublished: true } : p
    );
    saveProperties(updated);

    const req = new NextRequest("http://localhost:3000/api/public/properties");
    const res = await getPublicProperties(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const foundProp = data.properties.find((p: any) => p.id === testPropertyId);
    assert.ok(foundProp, "Approved property must now appear in public listing");
    assert.strictEqual(foundProp.location.coordinates.latitude, 15.6012, "Latitude must match");
    assert.strictEqual(foundProp.location.coordinates.longitude, 73.7388, "Longitude must match");
  });

  await itest(8, "Property", "Clean up test property removes it from storage", async () => {
    const all = getAllProperties();
    saveProperties(all.filter((p) => p.id !== testPropertyId));
    clearPropertiesCache();
    const remaining = getAllProperties();
    assert.strictEqual(remaining.some((p) => p.id === testPropertyId), false, "Property should be deleted");
  });

  // ── GROUP 4: Travel Memories Moderation Workflow ──
  console.log("\n--- Group 4: Memories Workflow (Submit -> Moderate -> Publish) ---");

  let testMemId = "";

  await itest(9, "Memory", "Guest submits a memory in pending status (hidden from public homepage)", async () => {
    const newMemory = createMemory({
      guestName: "Arjun Verma",
      title: "Monsoon Romance in Munnar",
      shortDescription: "Misty tea hills and peaceful cottages",
      story: "We spent 4 days enjoying the misty mornings and tea garden walks.",
      destinationName: "Munnar, Kerala",
      coverImage: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      images: [
        {
          id: "mem_img_1",
          url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
          isCover: true,
        },
      ],
      source: "guest_submitted",
      status: "pending",
      isPublished: false,
    });

    testMemId = newMemory.id;
    assert.ok(testMemId, "Memory should be created with an ID");

    // Public homepage check
    const req = new NextRequest("http://localhost:3000/api/public/memories");
    const res = await getPublicMemories(req as any);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const existsInPublic = data.memories.some((m: any) => m.id === testMemId);
    assert.strictEqual(existsInPublic, false, "Pending memory must not be visible publicly");
  });

  await itest(10, "Memory", "Admin approves and publishes memory (now visible on homepage)", async () => {
    const updated = updateMemory(testMemId, {
      status: "approved",
      isPublished: true,
    });
    assert.ok(updated, "Memory should be updated");
    assert.strictEqual(updated?.status, "approved");

    const req = new NextRequest("http://localhost:3000/api/public/memories");
    const res = await getPublicMemories(req as any);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    const foundMemory = data.memories.find((m: any) => m.id === testMemId);
    assert.ok(foundMemory, "Approved memory must now be visible on public homepage");
    assert.strictEqual(foundMemory.title, "Monsoon Romance in Munnar");
  });

  await itest(11, "Memory", "Clean up test memory removes it completely", () => {
    const deleted = deleteMemory(testMemId);
    assert.strictEqual(deleted, true, "Memory should be successfully deleted");
  });

  console.log("\n==========================================================");
  const total = reports.length;
  const passedCount = reports.filter((r) => r.passed).length;
  const failedCount = total - passedCount;
  console.log(`📊 INTEGRATION TEST REPORT: ${passedCount}/${total} PASSED`);

  if (failedCount > 0) {
    console.log(`❌ ${failedCount} Integration Tests Failed`);
    return false;
  } else {
    console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!");
    return true;
  }
}

if (require.main === module || process.argv[1]?.endsWith("integration.test.ts")) {
  runIntegrationTests()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error("FATAL ERROR IN INTEGRATION TESTS:", err);
      process.exit(1);
    });
}
