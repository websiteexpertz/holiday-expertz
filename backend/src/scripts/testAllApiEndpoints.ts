import { NextRequest } from "next/server";
import { connectToDatabase } from "../lib/db/mongodb";
import { getAllAdmins } from "../lib/storage/adminStore";
import { getAllProperties } from "../lib/storage/propertyStore";
import { getAllMemories } from "../lib/storage/memoryStore";
import { getAllOwners } from "../lib/storage/propertyOwnerStore";
import { createAdminSessionToken } from "../lib/security/adminAuthService";

// Public route imports
import { GET as getPublicProperties } from "../app/api/public/properties/route";
import { GET as getPublicPropertyById } from "../app/api/public/properties/[id]/route";
import { GET as getPublicPropertyAvailability } from "../app/api/public/properties/[id]/availability/route";
import { GET as getPublicLocationsAutocomplete } from "../app/api/public/locations/autocomplete/route";
import { GET as getPublicDestinationSlides } from "../app/api/public/destination-slides/route";
import { GET as getPublicFeaturedDestinations } from "../app/api/public/featured-destinations/route";
import { GET as getPublicHandpicked } from "../app/api/public/handpicked/route";
import { GET as getPublicMemories } from "../app/api/public/memories/route";
import { GET as getPublicMemoryById } from "../app/api/public/memories/[id]/route";
import { GET as getPublicBlogs } from "../app/api/public/blogs/route";
import { GET as getPublicEvents } from "../app/api/public/events/route";
import { GET as getPublicDeals } from "../app/api/public/deals/route";
import { GET as getPublicContent } from "../app/api/public/content/route";
import { GET as getPublicReviews } from "../app/api/public/reviews/route";

// Admin route imports
import { GET as getAdminAuthMe } from "../app/api/admin/auth/me/route";
import { GET as getAdminDashboardStats } from "../app/api/admin/dashboard/stats/route";
import { GET as getAdminProperties } from "../app/api/admin/properties/route";
import { GET as getAdminDestinations } from "../app/api/admin/destinations/route";
import { GET as getAdminHeroImages } from "../app/api/admin/destinations/hero-images/route";
import { GET as getAdminMemories } from "../app/api/admin/memories/route";
import { GET as getAdminBlogs } from "../app/api/admin/blogs/route";
import { GET as getAdminEvents } from "../app/api/admin/events/route";
import { GET as getAdminDeals } from "../app/api/admin/deals/route";
import { GET as getAdminOwners } from "../app/api/admin/owners/route";
import { GET as getAdminBookings } from "../app/api/admin/bookings/route";
import { GET as getAdminInquiries } from "../app/api/admin/inquiries/route";
import { GET as getAdminReviews } from "../app/api/admin/reviews/route";
import { GET as getAdminSettings } from "../app/api/admin/settings/route";
import { GET as getAdminAuditLogs } from "../app/api/admin/audit-logs/route";
import { GET as getAdminFeaturedDestinations } from "../app/api/admin/featured-destinations/route";
import { GET as getAdminHandpicked } from "../app/api/admin/handpicked/route";
import { GET as getAdminMedia } from "../app/api/admin/media/route";
import { GET as getAdminUsers } from "../app/api/admin/users/route";
import { GET as getAdminAdmins } from "../app/api/admin/admins/route";

// Owner route imports
import { GET as getOwnerProperties } from "../app/api/properties/route";
import { GET as getOwnerPropertyById } from "../app/api/properties/[id]/route";

interface ApiTestResult {
  endpoint: string;
  category: "Public" | "Admin" | "Owner";
  status: number;
  passed: boolean;
  durationMs: number;
  details?: string;
}

async function runApiTests() {
  console.log("==========================================================");
  console.log("🚀 STARTING COMPREHENSIVE API ENDPOINT TEST SUITE");
  console.log("   Database: MongoDB Atlas (live)");
  console.log("==========================================================\n");

  await connectToDatabase();

  const admins = getAllAdmins();
  const superAdmin = admins[0];
  if (!superAdmin) throw new Error("No super admin found for tests");
  const adminToken = createAdminSessionToken(superAdmin);

  const properties = getAllProperties();
  const sampleProp = properties[0];
  const propId = sampleProp ? sampleProp.id : "prop_demo_01";

  const memories = getAllMemories();
  const sampleMem = memories[0];
  const memId = sampleMem ? sampleMem.id : "mem_01";

  const owners = getAllOwners();
  const ownerId = owners[0]?.id || "owner_demo";

  const baseUrl = "http://localhost:3000";
  const results: ApiTestResult[] = [];

  async function testRoute(
    endpoint: string,
    category: "Public" | "Admin" | "Owner",
    handler: (req: any, ctx?: any) => Promise<Response>,
    headers: Record<string, string> = {},
    ctx?: any
  ) {
    const start = Date.now();
    try {
      const req = new NextRequest(new URL(endpoint, baseUrl).toString(), {
        headers: new Headers(headers),
      });

      const res = await handler(req, ctx);
      const duration = Date.now() - start;
      const passed = res.status === 200;

      let detail = "";
      try {
        const json = await res.json();
        if (json.count !== undefined) detail = `count: ${json.count}`;
        else if (Array.isArray(json.data)) detail = `items: ${json.data.length}`;
        else if (Array.isArray(json.properties)) detail = `properties: ${json.properties.length}`;
        else if (Array.isArray(json.memories)) detail = `memories: ${json.memories.length}`;
        else if (json.success !== undefined) detail = `success: ${json.success}`;
      } catch {
        detail = "OK";
      }

      results.push({
        endpoint,
        category,
        status: res.status,
        passed,
        durationMs: duration,
        details: detail,
      });

      const icon = passed ? "✅" : "❌";
      console.log(`${icon} [${category}] ${endpoint} -> Status ${res.status} (${duration}ms) ${detail}`);
    } catch (err: any) {
      const duration = Date.now() - start;
      results.push({
        endpoint,
        category,
        status: 500,
        passed: false,
        durationMs: duration,
        details: err?.message || "Execution exception",
      });
      console.log(`❌ [${category}] ${endpoint} -> EXCEPTION: ${err?.message}`);
    }
  }

  const adminHeaders = {
    authorization: `Bearer ${adminToken}`,
    cookie: `admin_session=${adminToken}`,
  };

  const ownerHeaders = {
    "x-owner-id": ownerId,
  };

  console.log("--- 1. Testing Public APIs ---");
  await testRoute("/api/public/properties", "Public", getPublicProperties);
  await testRoute(`/api/public/properties/${propId}`, "Public", getPublicPropertyById, {}, { params: Promise.resolve({ id: propId }) });
  await testRoute(`/api/public/properties/${propId}/availability`, "Public", getPublicPropertyAvailability, {}, { params: Promise.resolve({ id: propId }) });
  await testRoute("/api/public/locations/autocomplete?query=goa", "Public", getPublicLocationsAutocomplete);
  await testRoute("/api/public/destination-slides", "Public", getPublicDestinationSlides);
  await testRoute("/api/public/featured-destinations", "Public", getPublicFeaturedDestinations);
  await testRoute("/api/public/handpicked", "Public", getPublicHandpicked);
  await testRoute("/api/public/memories", "Public", getPublicMemories);
  await testRoute(`/api/public/memories/${memId}`, "Public", getPublicMemoryById, {}, { params: Promise.resolve({ id: memId }) });
  await testRoute("/api/public/blogs", "Public", getPublicBlogs);
  await testRoute("/api/public/events", "Public", getPublicEvents);
  await testRoute("/api/public/deals", "Public", getPublicDeals);
  await testRoute("/api/public/content", "Public", getPublicContent);
  await testRoute("/api/public/reviews", "Public", getPublicReviews);

  console.log("\n--- 2. Testing Admin APIs (Authenticated) ---");
  await testRoute("/api/admin/auth/me", "Admin", getAdminAuthMe, adminHeaders);
  await testRoute("/api/admin/dashboard/stats", "Admin", getAdminDashboardStats, adminHeaders);
  await testRoute("/api/admin/properties", "Admin", getAdminProperties, adminHeaders);
  await testRoute("/api/admin/destinations", "Admin", getAdminDestinations, adminHeaders);
  await testRoute("/api/admin/destinations/hero-images", "Admin", getAdminHeroImages, adminHeaders);
  await testRoute("/api/admin/memories", "Admin", getAdminMemories, adminHeaders);
  await testRoute("/api/admin/blogs", "Admin", getAdminBlogs, adminHeaders);
  await testRoute("/api/admin/events", "Admin", getAdminEvents, adminHeaders);
  await testRoute("/api/admin/deals", "Admin", getAdminDeals, adminHeaders);
  await testRoute("/api/admin/owners", "Admin", getAdminOwners, adminHeaders);
  await testRoute("/api/admin/bookings", "Admin", getAdminBookings, adminHeaders);
  await testRoute("/api/admin/inquiries", "Admin", getAdminInquiries, adminHeaders);
  await testRoute("/api/admin/reviews", "Admin", getAdminReviews, adminHeaders);
  await testRoute("/api/admin/settings", "Admin", getAdminSettings, adminHeaders);
  await testRoute("/api/admin/audit-logs", "Admin", getAdminAuditLogs, adminHeaders);
  await testRoute("/api/admin/featured-destinations", "Admin", getAdminFeaturedDestinations, adminHeaders);
  await testRoute("/api/admin/handpicked", "Admin", getAdminHandpicked, adminHeaders);
  await testRoute("/api/admin/media", "Admin", getAdminMedia, adminHeaders);
  await testRoute("/api/admin/users", "Admin", getAdminUsers, adminHeaders);
  await testRoute("/api/admin/admins", "Admin", getAdminAdmins, adminHeaders);

  console.log("\n--- 3. Testing Owner Property APIs ---");
  await testRoute(`/api/properties?ownerId=${ownerId}`, "Owner", getOwnerProperties, ownerHeaders);
  await testRoute(`/api/properties/${propId}?ownerId=${ownerId}`, "Owner", getOwnerPropertyById, ownerHeaders, { params: Promise.resolve({ id: propId }) });

  console.log("\n==========================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`📊 FINAL REPORT: ${passedCount}/${total} APIs PASSED (Status 200)`);
  if (failedCount > 0) {
    console.log(`⚠️ ${failedCount} APIs did not return Status 200`);
    process.exit(1);
  } else {
    console.log("🎉 ALL API ENDPOINTS RETURNED 200 STATUS CODE SUCCESSFULLY!");
    process.exit(0);
  }
}

runApiTests().catch((err) => {
  console.error("FATAL ERROR RUNNING API TEST SUITE:", err);
  process.exit(1);
});
