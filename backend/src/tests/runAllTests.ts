import { runUnitTests } from "./unit.test";
import { runIntegrationTests } from "./integration.test";

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║           HOLIDAYEXPERTZ MASTER TEST SUITE               ║");
  console.log("║            Unit Tests + Integration Tests                ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const startTime = Date.now();

  console.log("▶ STEP 1: Running Unit Tests...\n");
  const unitPassed = await runUnitTests();

  console.log("\n▶ STEP 2: Running Integration Tests...\n");
  const integrationPassed = await runIntegrationTests();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                 EXECUTIVE SUMMARY                        ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  1. Unit Tests:        ${unitPassed ? "✅ ALL PASSED (18/18)" : "❌ FAILED"}            ║`);
  console.log(`║  2. Integration Tests: ${integrationPassed ? "✅ ALL PASSED (11/11)" : "❌ FAILED"}            ║`);
  console.log(`║  Total Time:           ${totalTime}s                            ║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  if (!unitPassed || !integrationPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Master test execution error:", err);
  process.exit(1);
});
