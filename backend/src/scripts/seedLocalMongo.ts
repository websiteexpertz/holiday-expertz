import fs from "fs";
import path from "path";

// Load .env.local if not already in process.env
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      const val = vals.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/mongodb";
import { CountryModel, StateModel, CityModel, AreaModel } from "../lib/models/Destination";
import { PropertyModel } from "../lib/models/Property";
import { AdminModel } from "../lib/models/Admin";
import { DestinationHeroImageModel } from "../lib/models/DestinationHeroImage";
import { MemoryModel } from "../lib/models/Memory";
import { getAllDestinations } from "../lib/storage/destinationStore";
import { getAllProperties } from "../lib/storage/propertyStore";
import { getAllAdmins } from "../lib/storage/adminStore";
import { getAllDestinationHeroImages } from "../lib/storage/destinationHeroImageStore";
import { getAllMemories } from "../lib/storage/memoryStore";

async function seed() {
  console.log("🚀 Connecting to MongoDB Atlas...");
  await connectToDatabase();
  console.log(" Connected to MongoDB successfully at:", mongoose.connection.host, mongoose.connection.name);

  // 1. Seed Destinations Hierarchy
  console.log("\n📍 Seeding Destinations Hierarchy...");
  const hierarchy = getAllDestinations();

  for (const country of hierarchy.countries) {
    await CountryModel.findOneAndUpdate({ id: country.id }, country, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Countries seeded: ${hierarchy.countries.length}`);

  for (const state of hierarchy.states) {
    await StateModel.findOneAndUpdate({ id: state.id }, state, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  States seeded: ${hierarchy.states.length}`);

  for (const city of hierarchy.cities) {
    await CityModel.findOneAndUpdate({ id: city.id }, city, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Cities seeded: ${hierarchy.cities.length}`);

  for (const area of hierarchy.areas) {
    await AreaModel.findOneAndUpdate({ id: area.id }, area, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Areas seeded: ${hierarchy.areas.length}`);

  // 2. Seed Properties
  console.log("\n🏡 Seeding Properties...");
  const properties = getAllProperties();
  for (const prop of properties) {
    await PropertyModel.findOneAndUpdate({ id: prop.id }, prop, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Properties seeded: ${properties.length}`);

  // 3. Seed Hero Images
  console.log("\n🖼️ Seeding Destination Hero Images...");
  const heroImages = getAllDestinationHeroImages();
  for (const img of heroImages) {
    await DestinationHeroImageModel.findOneAndUpdate({ id: img.id }, img, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Hero Images seeded: ${heroImages.length}`);

  // 4. Seed Memories
  console.log("\n📖 Seeding Travel Memories...");
  const memories = getAllMemories();
  for (const mem of memories) {
    await MemoryModel.findOneAndUpdate({ id: mem.id }, mem, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Memories seeded: ${memories.length}`);

  // 5. Seed Admins
  console.log("\n👑 Seeding Super Admin Account...");
  const admins = getAllAdmins();
  for (const admin of admins) {
    await AdminModel.findOneAndUpdate({ id: admin.id }, admin, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Admins seeded: ${admins.length}`);

  console.log("\n🎉 MongoDB Atlas seeding completed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
