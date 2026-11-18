const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Load .env.local
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }
}

const isApply = process.argv.includes("--apply");

function formatPropertyNumber(seq) {
  return `HE-${String(seq).padStart(6, "0")}`;
}

async function run() {
  console.log("==================================================================");
  console.log(`Holiday Expertz — Property Number Migration (${isApply ? "EXECUTE / APPLY" : "DRY RUN"})`);
  console.log("==================================================================");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI not found in environment.");
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const propColl = db.collection("properties");
  const counterColl = db.collection("counters");

  // 1. Fetch all documents from MongoDB
  const mongoDocs = await propColl.find({}).toArray();
  console.log(`Found ${mongoDocs.length} properties in MongoDB collection.`);

  // 2. Fetch all properties from backend/src/data/properties.json for cross-check
  const jsonPath = path.join(rootDir, "backend", "src", "data", "properties.json");
  let jsonProps = [];
  if (fs.existsSync(jsonPath)) {
    try {
      jsonProps = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch (e) {
      jsonProps = [];
    }
  }
  console.log(`Found ${jsonProps.length} properties in properties.json.`);

  // Combine and de-duplicate by id
  const docMap = new Map();
  for (const doc of mongoDocs) {
    docMap.set(doc.id, doc);
  }

  // 3. Deterministic Sort:
  // Primary: createdAt ascending (convert to epoch timestamp)
  // Secondary: id ascending
  const sortedDocs = Array.from(docMap.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || "").localeCompare(b.id || "");
  });

  // Check existing assigned numbers to avoid any reuse
  const existingNumbers = new Set();
  let maxExistingSeq = 0;
  for (const doc of sortedDocs) {
    if (doc.propertyNumber && typeof doc.propertyNumber === "string") {
      existingNumbers.add(doc.propertyNumber);
      const match = doc.propertyNumber.match(/^HE-(\d+)$/i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxExistingSeq) maxExistingSeq = seq;
      }
    }
  }

  // Determine assignments
  let nextSeq = 1;
  const plan = [];

  for (const doc of sortedDocs) {
    if (doc.propertyNumber) {
      plan.push({
        _id: doc._id,
        id: doc.id,
        name: doc.name,
        createdAt: doc.createdAt,
        currentNumber: doc.propertyNumber,
        assignedNumber: doc.propertyNumber,
        status: "PRESERVED",
      });
    } else {
      // Find next available sequence number
      while (existingNumbers.has(formatPropertyNumber(nextSeq))) {
        nextSeq++;
      }
      const assigned = formatPropertyNumber(nextSeq);
      existingNumbers.add(assigned);
      plan.push({
        _id: doc._id,
        id: doc.id,
        name: doc.name,
        createdAt: doc.createdAt,
        currentNumber: null,
        assignedNumber: assigned,
        status: "ASSIGN",
      });
      nextSeq++;
    }
  }

  const finalMaxSeq = Math.max(maxExistingSeq, nextSeq - 1);

  console.log("\n------------------------------------------------------------------");
  console.log("PROPOSED DETERMINISTIC ASSIGNMENT PLAN:");
  console.log("------------------------------------------------------------------");
  plan.forEach((item, idx) => {
    console.log(
      `[${idx + 1}] ${item.assignedNumber} | ID: ${item.id} | Name: "${item.name}" | CreatedAt: ${item.createdAt} | Action: ${item.status}`
    );
  });
  console.log("------------------------------------------------------------------");
  console.log(`Total properties examined: ${plan.length}`);
  console.log(`Total properties requiring number assignment: ${plan.filter((p) => p.status === "ASSIGN").length}`);
  console.log(`Total properties already numbered: ${plan.filter((p) => p.status === "PRESERVED").length}`);
  console.log(`Final Counter Sequence to sync: ${finalMaxSeq}`);
  console.log("------------------------------------------------------------------\n");

  if (!isApply) {
    console.log(">>> DRY RUN COMPLETE: NO DATABASE WRITES WERE EXECUTED. <<<");
    console.log("To execute this migration and persist the changes, run with --apply after obtaining approval.");
    await mongoose.disconnect();
    return;
  }

  // EXECUTE / APPLY
  console.log("Executing migration updates...");
  let updatedCount = 0;

  for (const item of plan) {
    if (item.status === "ASSIGN") {
      const res = await propColl.updateOne(
        { _id: item._id },
        { $set: { propertyNumber: item.assignedNumber } }
      );
      if (res.modifiedCount === 1) {
        updatedCount++;
      }
    }
  }

  // Synchronize Counter in MongoDB
  await counterColl.updateOne(
    { _id: "propertyNumber" },
    { $set: { sequence: finalMaxSeq } },
    { upsert: true }
  );
  console.log(`MongoDB Counter collection synchronized: sequence = ${finalMaxSeq}`);

  // Synchronize local JSON files
  const counterFilePath = path.join(rootDir, "backend", "src", "data", "counters.json");
  fs.writeFileSync(counterFilePath, JSON.stringify({ propertyNumber: finalMaxSeq }, null, 2), "utf8");
  console.log(`Local counters.json updated with sequence: ${finalMaxSeq}`);

  // Synchronize backend/src/data/properties.json with assigned numbers
  if (jsonProps.length > 0) {
    const assignedMap = new Map(plan.map((p) => [p.id, p.assignedNumber]));
    let jsonUpdated = 0;
    const updatedJsonProps = jsonProps.map((p) => {
      const assigned = assignedMap.get(p.id);
      if (assigned && p.propertyNumber !== assigned) {
        jsonUpdated++;
        return { ...p, propertyNumber: assigned };
      }
      return p;
    });
    fs.writeFileSync(jsonPath, JSON.stringify(updatedJsonProps, null, 2), "utf8");
    console.log(`properties.json updated: ${jsonUpdated} records synchronized.`);
  }

  // Create unique index on propertyNumber in MongoDB properties collection
  try {
    await propColl.createIndex({ propertyNumber: 1 }, { unique: true });
    console.log("MongoDB unique index on propertyNumber successfully verified / created.");
  } catch (idxErr) {
    console.warn("Index warning:", idxErr.message);
  }

  console.log(`\n>>> MIGRATION SUCCESSFUL! Updated ${updatedCount} properties in MongoDB. <<<`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed with error:", err);
  process.exit(1);
});
