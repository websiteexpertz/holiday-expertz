const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Load .env.local
const envPath = path.resolve(__dirname, "..", ".env.local");
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

async function inspect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI found.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully!");
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const PropertyColl = db.collection("properties");
    const count = await PropertyColl.countDocuments();
    console.log("Total property count in MongoDB properties collection:", count);

    const properties = await PropertyColl.find({}, { projection: { id: 1, name: 1, propertyNumber: 1, createdAt: 1 } }).sort({ createdAt: 1, _id: 1 }).toArray();
    console.log("MongoDB Properties list:");
    properties.forEach((p, idx) => {
      console.log(`[${idx + 1}] ID: ${p.id} | Name: "${p.name}" | PropertyNumber: ${p.propertyNumber || "NONE"} | CreatedAt: ${p.createdAt}`);
    });

    const CounterColl = db.collection("counters");
    const counterDoc = await CounterColl.findOne({ _id: "propertyNumber" });
    console.log("Counter document:", counterDoc);

    await mongoose.disconnect();
  } catch (err) {
    console.error("MongoDB inspection error:", err.message);
  }
}

inspect();
