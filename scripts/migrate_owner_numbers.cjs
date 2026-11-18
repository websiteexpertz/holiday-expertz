/**
 * Holiday Expertz — Safe, Idempotent Owner Number Migration Script
 *
 * Assigns unique, permanent Owner Numbers (HE-OWN-XXXXXX) to existing property owners.
 * Completely isolates ownerNumber sequence from propertyNumber sequence.
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const rootDir = path.resolve(__dirname, "..");
const COUNTER_FILE = path.join(rootDir, "backend", "src", "data", "counters.json");
const OWNERS_FILE = path.join(rootDir, "backend", "src", "data", "propertyOwners.json");
const PROPERTIES_FILE = path.join(rootDir, "backend", "src", "data", "properties.json");

function formatOwnerNumber(seq) {
  if (seq <= 0) return "HE-OWN-000001";
  return `HE-OWN-${String(seq).padStart(6, "0")}`;
}

function parseOwnerNumber(ownerNumber) {
  if (!ownerNumber || typeof ownerNumber !== "string") return null;
  const match = ownerNumber.trim().match(/^HE-OWN-(\d+)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

function readCounters() {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      return JSON.parse(fs.readFileSync(COUNTER_FILE, "utf-8"));
    }
  } catch (err) {
    console.warn("Could not read counters.json:", err.message);
  }
  return {};
}

function writeCounters(data) {
  const dir = path.dirname(COUNTER_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(COUNTER_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function readLocalOwners() {
  if (fs.existsSync(OWNERS_FILE)) {
    return JSON.parse(fs.readFileSync(OWNERS_FILE, "utf-8"));
  }
  return [];
}

function writeLocalOwners(owners) {
  const dir = path.dirname(OWNERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OWNERS_FILE, JSON.stringify(owners, null, 2), "utf-8");
}

async function runMigration() {
  console.log("=== Starting Holiday Expertz Owner Number Migration ===");

  const initialCounters = readCounters();
  const initialPropertyCounter = initialCounters.propertyNumber;
  console.log(`Initial propertyNumber counter: ${initialPropertyCounter}`);

  let mongoConnected = false;
  let db = null;
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    for (const p of ["backend/.env.local", "backend/.env", ".env.local", ".env"]) {
      const fullPath = path.resolve(__dirname, "..", p);
      if (fs.existsSync(fullPath)) {
        const lines = fs.readFileSync(fullPath, "utf-8").split("\n");
        for (const line of lines) {
          const match = line.match(/^\s*MONGODB_URI\s*=\s*(.*)$/);
          if (match) {
            mongoUri = match[1].trim().replace(/^['"]|['"]$/g, "");
            break;
          }
        }
        if (mongoUri) break;
      }
    }
  }
  mongoUri = mongoUri || "mongodb://localhost:27017/holidayexpertz";

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    mongoConnected = true;
    db = mongoose.connection;
    console.log("✓ Connected to MongoDB");
  } catch (err) {
    console.log(`ℹ MongoDB not connected (${err.message}). Proceeding with local storage migration.`);
  }

  let owners = [];
  if (mongoConnected) {
    const mongoOwners = await db.collection("propertyOwners").find({}).toArray();
    if (mongoOwners.length > 0) {
      owners = mongoOwners;
    } else {
      owners = readLocalOwners();
      if (owners.length > 0) {
        console.log(`Syncing ${owners.length} local owners into MongoDB...`);
        for (const o of owners) {
          await db.collection("propertyOwners").updateOne({ id: o.id }, { $set: o }, { upsert: true });
        }
      }
    }
  } else {
    owners = readLocalOwners();
  }

  console.log(`Total owner records to inspect: ${owners.length}`);

  // 1. Identify existing valid owner numbers
  let highestSeq = 0;
  const assignedNumbers = new Set();
  const validOwners = [];
  const needsNumberOwners = [];

  for (const owner of owners) {
    const parsed = parseOwnerNumber(owner.ownerNumber);
    if (parsed) {
      validOwners.push(owner);
      assignedNumbers.add(owner.ownerNumber);
      if (parsed > highestSeq) highestSeq = parsed;
    } else {
      needsNumberOwners.push(owner);
    }
  }

  console.log(`Owners with existing valid Owner Numbers: ${validOwners.length} (Highest Seq: ${highestSeq})`);
  console.log(`Owners needing unique Owner Numbers: ${needsNumberOwners.length}`);

  // 2. Sort deterministically by createdAt timestamp, fallback to id
  needsNumberOwners.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  // 3. Assign sequential Owner Numbers
  let currentSeq = highestSeq;
  let migratedCount = 0;

  for (const owner of needsNumberOwners) {
    currentSeq++;
    const generatedNumber = formatOwnerNumber(currentSeq);
    owner.ownerNumber = generatedNumber;
    assignedNumbers.add(generatedNumber);
    migratedCount++;

    console.log(`Assigned ${generatedNumber} -> ${owner.fullName} (${owner.email})`);

    if (mongoConnected) {
      await db.collection("propertyOwners").updateOne(
        { id: owner.id },
        { $set: { ownerNumber: generatedNumber } }
      );
    }
  }

  // 4. Update local file
  const allOwnersCombined = [...validOwners, ...needsNumberOwners];
  writeLocalOwners(allOwnersCombined);
  console.log(`✓ Local propertyOwners.json synchronized with ${allOwnersCombined.length} owners.`);

  // 5. Update independent ownerNumber counter
  const updatedCounters = readCounters();
  updatedCounters.ownerNumber = Math.max(updatedCounters.ownerNumber || 0, currentSeq);
  writeCounters(updatedCounters);
  console.log(`✓ Updated local counter file: ownerNumber = ${updatedCounters.ownerNumber}`);

  if (mongoConnected) {
    await db.collection("counters").updateOne(
      { _id: "ownerNumber" },
      { $set: { sequence: updatedCounters.ownerNumber } },
      { upsert: true }
    );
    console.log(`✓ Updated MongoDB Counter collection: ownerNumber = ${updatedCounters.ownerNumber}`);

    // Create unique sparse index on ownerNumber
    try {
      await db.collection("propertyOwners").createIndex(
        { ownerNumber: 1 },
        { unique: true, sparse: true, background: true }
      );
      console.log("✓ MongoDB unique index on ownerNumber verified.");
    } catch (idxErr) {
      console.warn("Index creation warning:", idxErr.message);
    }

    await mongoose.disconnect();
  }

  // 6. Verification: Ensure Property Numbers and counter are completely untouched
  const finalCounters = readCounters();
  if (initialPropertyCounter !== undefined && finalCounters.propertyNumber !== initialPropertyCounter) {
    throw new Error(`CRITICAL VIOLATION: propertyNumber counter changed from ${initialPropertyCounter} to ${finalCounters.propertyNumber}!`);
  }
  console.log(`✓ Verified propertyNumber sequence completely untouched (${finalCounters.propertyNumber}).`);

  // 7. Verify no duplicate owner numbers exist
  const checkNumbers = new Set();
  for (const o of allOwnersCombined) {
    if (!o.ownerNumber) {
      throw new Error(`Owner ${o.id} is missing ownerNumber after migration!`);
    }
    if (checkNumbers.has(o.ownerNumber)) {
      throw new Error(`Duplicate ownerNumber detected: ${o.ownerNumber}!`);
    }
    checkNumbers.add(o.ownerNumber);
  }
  console.log(`✓ Verified ${checkNumbers.size} unique Owner Numbers across all owners.`);

  console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY! 🎉 ===");
}

if (require.main === module) {
  runMigration().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}

module.exports = { runMigration };
