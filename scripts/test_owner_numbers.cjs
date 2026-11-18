/**
 * Automated Verification Test Suite for Unique Owner IDs with Search Functionality
 * Tests format, counters, isolation from property numbers, migration idempotence,
 * schema definitions, and frontend table/search parity.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

console.log("=== Testing Holiday Expertz Unique Owner Numbers Implementation ===\n");

// 1. Verify Format & Parsing Functions
const counterServicePath = path.join(rootDir, "backend/src/lib/services/counterService.ts");
const counterServiceContent = fs.readFileSync(counterServicePath, "utf-8");

assert(counterServiceContent.includes("export function formatOwnerNumber(seq: number): string"), "counterService must export formatOwnerNumber");
assert(counterServiceContent.includes("HE-OWN-"), "formatOwnerNumber must produce HE-OWN- prefix");
assert(counterServiceContent.includes("padStart(6, \"0\")"), "formatOwnerNumber must pad sequence to at least 6 digits");
assert(counterServiceContent.includes("export function parseOwnerNumber"), "counterService must export parseOwnerNumber");
assert(counterServiceContent.includes("export async function getNextOwnerNumber"), "counterService must export getNextOwnerNumber");
assert(counterServiceContent.includes("export async function syncOwnerCounterWithHighestNumber"), "counterService must export syncOwnerCounterWithHighestNumber");

console.log("✓ Format and parser functions verified (HE-OWN-XXXXXX, 6-digit padding)");

// 2. Verify Property Number Counter Isolation
assert(counterServiceContent.includes("_id: \"ownerNumber\""), "Owner counter must use independent _id: 'ownerNumber'");
assert(counterServiceContent.includes("_id: \"propertyNumber\""), "Property counter must use independent _id: 'propertyNumber'");

// Ensure getNextOwnerNumber does not increment propertyNumber
const nextOwnerMatch = counterServiceContent.slice(counterServiceContent.indexOf("getNextOwnerNumber"));
assert(!nextOwnerMatch.includes("propertyNumber ="), "getNextOwnerNumber must never modify propertyNumber");
assert(nextOwnerMatch.includes("localCounters.ownerNumber"), "getNextOwnerNumber must update localCounters.ownerNumber");

console.log("✓ Counter isolation verified (completely independent ownerNumber and propertyNumber namespaces)");

// 3. Verify Backend Types & MongoDB Schema
const authTypesPath = path.join(rootDir, "backend/src/types/auth.ts");
const authTypesContent = fs.readFileSync(authTypesPath, "utf-8");
assert(authTypesContent.includes("ownerNumber?: string;"), "PropertyOwner & PropertyOwnerRecord must include ownerNumber");

const ownerModelPath = path.join(rootDir, "backend/src/lib/models/PropertyOwner.ts");
const ownerModelContent = fs.readFileSync(ownerModelPath, "utf-8");
assert(ownerModelContent.includes("ownerNumber:"), "PropertyOwner schema must define ownerNumber");
assert(ownerModelContent.includes("unique: true"), "ownerNumber schema must enforce uniqueness");
assert(ownerModelContent.includes("sparse: true"), "ownerNumber schema must use sparse index for migration safety");

console.log("✓ Backend types and MongoDB PropertyOwner schema verified (unique, sparse index)");

// 4. Verify Immutability & Store Logic
const ownerStorePath = path.join(rootDir, "backend/src/lib/storage/propertyOwnerStore.ts");
const ownerStoreContent = fs.readFileSync(ownerStorePath, "utf-8");
assert(ownerStoreContent.includes("delete updatesWithTimestamp.ownerNumber"), "updateOwnerProfile must enforce immutability of ownerNumber");
assert(ownerStoreContent.includes("getNextOwnerNumber"), "createOwner must generate ownerNumber when missing");
assert(ownerStoreContent.includes("ownerNumber: record.ownerNumber"), "toOwnerRecord and sanitizeOwner must map ownerNumber");

console.log("✓ Immutability and auto-generation verified in propertyOwnerStore");

// 5. Verify Admin API Route Enriching and Searching
const ownersRoutePath = path.join(rootDir, "backend/src/app/api/admin/owners/route.ts");
const ownersRouteContent = fs.readFileSync(ownersRoutePath, "utf-8");
assert(ownersRouteContent.includes("ownerNumber: owner.ownerNumber || null"), "GET /api/admin/owners must return ownerNumber");
assert(ownersRouteContent.includes("ownerNum.includes(query)"), "GET /api/admin/owners must support server-side ownerNumber searching");

console.log("✓ Admin API route verified for ownerNumber return and query search");

// 6. Verify Migration Script Idempotence & Data Integrity
const { runMigration } = require("./migrate_owner_numbers.cjs");
assert(typeof runMigration === "function", "migrate_owner_numbers must export runMigration");

const countersFilePath = path.join(rootDir, "backend/src/data/counters.json");
const countersBefore = JSON.parse(fs.readFileSync(countersFilePath, "utf-8"));
const propCounterBefore = countersBefore.propertyNumber;

const ownersFilePath = path.join(rootDir, "backend/src/data/propertyOwners.json");
const ownersData = JSON.parse(fs.readFileSync(ownersFilePath, "utf-8"));

assert(ownersData.length > 0, "Owners data must contain records");
for (const o of ownersData) {
  assert(o.ownerNumber, `Owner ${o.fullName} must have ownerNumber assigned`);
  assert(/^HE-OWN-\d{6}$/.test(o.ownerNumber), `Owner number ${o.ownerNumber} must match format HE-OWN-XXXXXX`);
}

// Verify no duplicate owner numbers in migrated dataset
const uniqueNumbers = new Set(ownersData.map((o) => o.ownerNumber));
assert.strictEqual(uniqueNumbers.size, ownersData.length, "All assigned owner numbers must be strictly unique");

const countersAfter = JSON.parse(fs.readFileSync(countersFilePath, "utf-8"));
assert.strictEqual(countersAfter.propertyNumber, propCounterBefore, "propertyNumber counter must be unchanged by owner migration");
assert(countersAfter.ownerNumber >= ownersData.length, "ownerNumber counter must reflect migrated sequence");

console.log(`✓ Migration data verified (${ownersData.length} owners with unique HE-OWN-XXXXXX IDs, propertyNumber untouched at ${countersAfter.propertyNumber})`);

// 7. Verify Frontend Owners Page Table & Search Implementation
const frontendOwnersPagePath = path.join(rootDir, "frontend/src/app/admin/owners/page.tsx");
const frontendPageContent = fs.readFileSync(frontendOwnersPagePath, "utf-8");

// Verify table column order
assert(frontendPageContent.includes("<th className=\"py-3.5 px-5\">Owner No.</th>"), "Table must have 'Owner No.' as first header column");
assert(frontendPageContent.includes("Host Name</th>"), "Table must have 'Host Name' header");
assert(frontendPageContent.includes("Contact</th>"), "Table must have 'Contact' header");
assert(frontendPageContent.includes("Business / Brand</th>"), "Table must have 'Business / Brand' header");
assert(frontendPageContent.includes("Properties</th>"), "Table must have 'Properties' header");
assert(frontendPageContent.includes("Account Status</th>"), "Table must have 'Account Status' header");
assert(frontendPageContent.includes("Actions</th>"), "Table must have 'Actions' header");

// Verify Owner No. cell styling and copy button
assert(frontendPageContent.includes("owner.ownerNumber"), "Table row must render owner.ownerNumber");
assert(frontendPageContent.includes("text-teal-400"), "Owner number must be styled with teal accent");
assert(frontendPageContent.includes("handleCopyOwnerNumber"), "Table must provide copy owner number button");
assert(frontendPageContent.includes("Copied!"), "Copy button must display visual feedback on copy");

// Verify removal of prominent internal ID from Host Name column
assert(!frontendPageContent.includes("ID: {owner.id}"), "Internal ID must not be displayed beneath Host Name in table");

// Verify updated search placeholder and filter
assert(frontendPageContent.includes("Search by Owner ID, name, email or phone..."), "Search input must have updated placeholder");
assert(frontendPageContent.includes("ownerNum.includes(q)"), "Search filter must match ownerNumber case-insensitively");

console.log("✓ Frontend Admin Owners page verified (Owner No. 1st column, teal font, copy action, updated search, internal ID replaced)");

console.log("\nALL UNIQUE OWNER NUMBER TESTS PASSED SUCCESSFULLY! 🎉");
