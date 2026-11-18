const assert = require("assert");

// Test formatPropertyNumber
function formatPropertyNumber(seq) {
  if (seq <= 0) return "HE-000001";
  return `HE-${String(seq).padStart(6, "0")}`;
}

function parsePropertyNumber(propertyNumber) {
  if (!propertyNumber || typeof propertyNumber !== "string") return null;
  const match = propertyNumber.trim().match(/^HE-(\d+)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

// 1. Format tests
assert.strictEqual(formatPropertyNumber(1), "HE-000001");
assert.strictEqual(formatPropertyNumber(2), "HE-000002");
assert.strictEqual(formatPropertyNumber(10), "HE-000010");
assert.strictEqual(formatPropertyNumber(100), "HE-000100");
assert.strictEqual(formatPropertyNumber(1000), "HE-001000");
assert.strictEqual(formatPropertyNumber(999999), "HE-999999");
assert.strictEqual(formatPropertyNumber(1000000), "HE-1000000"); // Supports > 999999 without truncation
console.log("✓ formatPropertyNumber tests passed");

// 2. Parse tests
assert.strictEqual(parsePropertyNumber("HE-000001"), 1);
assert.strictEqual(parsePropertyNumber("he-000001"), 1); // case-insensitive
assert.strictEqual(parsePropertyNumber("HE-001000"), 1000);
assert.strictEqual(parsePropertyNumber("HE-1000000"), 1000000);
assert.strictEqual(parsePropertyNumber("invalid"), null);
assert.strictEqual(parsePropertyNumber(undefined), null);
console.log("✓ parsePropertyNumber tests passed");

// 3. Search Matching Logic Test
const testProperties = [
  { id: "p1", propertyNumber: "HE-000001", name: "Alpine Luxury Chalet", location: { city: "Manali", state: "HP", locality: "Old Manali" }, ownerId: "own_1" },
  { id: "p2", propertyNumber: "HE-000002", name: "Sea View Villa", location: { city: "Goa", state: "Goa", locality: "Anjuna" }, ownerId: "own_2" },
  { id: "p3", propertyNumber: "HE-000003", name: "Heritage Haveli", location: { city: "Jaipur", state: "Rajasthan", locality: "Pink City" }, ownerId: "own_3" },
];

const ownerMap = new Map([
  ["own_1", "Rajesh Sharma"],
  ["own_2", "John Fernandes"],
  ["own_3", "Vikram Singh"],
]);

function filterProperties(properties, search) {
  if (!search) return properties;
  const cleanSearch = search.toLowerCase().trim();
  const searchDigits = cleanSearch.replace(/^he-0*/i, "").replace(/^0+/, "");

  return properties.filter((p) => {
    const propNum = (p.propertyNumber || "").toLowerCase();
    const propDigits = propNum.replace(/^he-0*/i, "").replace(/^0+/, "");
    const matchesPropertyNumber =
      Boolean(propNum) &&
      (propNum.includes(cleanSearch) ||
        cleanSearch.includes(propNum) ||
        (searchDigits.length > 0 && propDigits === searchDigits));

    return (
      matchesPropertyNumber ||
      p.name.toLowerCase().includes(cleanSearch) ||
      p.location.city.toLowerCase().includes(cleanSearch) ||
      p.location.state.toLowerCase().includes(cleanSearch) ||
      p.location.locality.toLowerCase().includes(cleanSearch) ||
      (ownerMap.get(p.ownerId) || "").toLowerCase().includes(cleanSearch)
    );
  });
}

// Search Test: Exact Property Number
let res = filterProperties(testProperties, "HE-000003");
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, "p3");
console.log("✓ Exact match HE-000003 passed");

// Search Test: Case-insensitive
res = filterProperties(testProperties, "he-000003");
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, "p3");
console.log("✓ Case-insensitive match he-000003 passed");

// Search Test: Numeric portion "000003"
res = filterProperties(testProperties, "000003");
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, "p3");
console.log("✓ Numeric portion 000003 passed");

// Search Test: Single digit "3"
res = filterProperties(testProperties, "3");
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, "p3");
console.log("✓ Single digit 3 passed");

// Search Test: Partial prefix "HE-000"
res = filterProperties(testProperties, "HE-000");
assert.strictEqual(res.length, 3);
console.log("✓ Partial prefix HE-000 passed (matches all 3)");

// Search Test: Title "Alpine"
res = filterProperties(testProperties, "Alpine");
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, "p1");
console.log("✓ Title search 'Alpine' passed");

// Search Test: City "Goa"
res = filterProperties(testProperties, "Goa");
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, "p2");
console.log("✓ City search 'Goa' passed");

// Search Test: Owner "Vikram"
res = filterProperties(testProperties, "Vikram");
assert.strictEqual(res.length, 1);
assert.strictEqual(res[0].id, "p3");
console.log("✓ Owner search 'Vikram' passed");

// Search Test: Non-existent
res = filterProperties(testProperties, "HE-999999");
assert.strictEqual(res.length, 0);
console.log("✓ Empty search results passed");

console.log("\nALL PROPERTY NUMBER TESTS PASSED SUCCESSFULLY!");
