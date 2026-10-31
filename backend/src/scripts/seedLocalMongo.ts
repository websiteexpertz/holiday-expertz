import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/mongodb";
import { CountryModel, StateModel, CityModel, AreaModel } from "../lib/models/Destination";
import { PropertyModel } from "../lib/models/Property";
import { AdminModel } from "../lib/models/Admin";
import { getAllDestinations } from "../lib/storage/destinationStore";
import { getAllProperties } from "../lib/storage/propertyStore";
import { getAllAdmins } from "../lib/storage/adminStore";

async function seed() {
  console.log("🚀 Connecting to MongoDB...");
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

  // 3. Seed Admins
  console.log("\n👑 Seeding Super Admin Account...");
  const admins = getAllAdmins();
  for (const admin of admins) {
    await AdminModel.findOneAndUpdate({ id: admin.id }, admin, { upsert: true, returnDocument: 'after' });
  }
  console.log(`  Admins seeded: ${admins.length}`);

  console.log("\n🎉 Database seeding completed successfully!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
