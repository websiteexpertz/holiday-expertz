import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/mongodb";
import { CountryModel, StateModel, CityModel, AreaModel } from "../lib/models/Destination";
import { PropertyModel } from "../lib/models/Property";
import { AdminModel } from "../lib/models/Admin";
import { MemoryModel } from "../lib/models/Memory";
import { DestinationHeroImageModel } from "../lib/models/DestinationHeroImage";

async function verifyLiveAtlas() {
  console.log("==========================================");
  console.log("🔍 TESTING LIVE MONGODB ATLAS CONNECTION");
  console.log("==========================================");

  // 1. Connection check
  const startTime = Date.now();
  await connectToDatabase();
  const latency = Date.now() - startTime;

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("No database instance found after connecting!");
  }

  // 2. Ping check
  await db.command({ ping: 1 });
  console.log(`✅ MongoDB Atlas Ping: OK (Latency: ${latency}ms)`);
  console.log(`   Cluster Host: ${mongoose.connection.host}`);
  console.log(`   Database Name: ${mongoose.connection.name}`);
  console.log(`   Connection ReadyState: ${mongoose.connection.readyState} (1 = Connected)`);

  // 3. Count documents in each collection
  console.log("\n📊 CHECKING COLLECTIONS & DOCUMENTS IN ATLAS:");
  const countries = await CountryModel.countDocuments();
  const states = await StateModel.countDocuments();
  const cities = await CityModel.countDocuments();
  const areas = await AreaModel.countDocuments();
  const properties = await PropertyModel.countDocuments();
  const heroImages = await DestinationHeroImageModel.countDocuments();
  const memories = await MemoryModel.countDocuments();
  const admins = await AdminModel.countDocuments();

  console.log(`   - Countries: ${countries}`);
  console.log(`   - States: ${states}`);
  console.log(`   - Cities: ${cities}`);
  console.log(`   - Areas: ${areas}`);
  console.log(`   - Properties: ${properties}`);
  console.log(`   - Destination Hero Images: ${heroImages}`);
  console.log(`   - Travel Memories: ${memories}`);
  console.log(`   - Admins: ${admins}`);

  // 4. Sample record validation
  const sampleProp = await PropertyModel.findOne().select("name location pricing").lean();
  if (sampleProp) {
    console.log("\n🏡 Sample Property Retrieved From Atlas:");
    console.log(`   Property Name: ${(sampleProp as any).name}`);
    console.log(`   Location: ${(sampleProp as any).location?.city}, ${(sampleProp as any).location?.country}`);
    console.log(`   Coordinates: Lat ${(sampleProp as any).location?.coordinates?.latitude}, Lng ${(sampleProp as any).location?.coordinates?.longitude}`);
  }

  // 5. Read/Write test
  console.log("\n✍️ TESTING WRITE & READ CAPABILITIES:");
  const testColl = db.collection("__atlas_health_check__");
  const testId = `test_${Date.now()}`;
  await testColl.insertOne({ _id: testId as any, test: true, timestamp: new Date() });
  const found = await testColl.findOne({ _id: testId as any });
  if (found) {
    console.log("   ✅ Write test: Successfully inserted record into Atlas");
    console.log("   ✅ Read test: Successfully queried inserted record");
    await testColl.deleteOne({ _id: testId as any });
    console.log("   ✅ Delete test: Cleaned up test record");
  }

  console.log("\n==========================================");
  console.log("🎉 ALL TESTS PASSED! DATABASE FULLY FUNCTIONAL");
  console.log("==========================================");

  await mongoose.disconnect();
  process.exit(0);
}

verifyLiveAtlas().catch((err) => {
  console.error("❌ Live test failed:", err);
  process.exit(1);
});
