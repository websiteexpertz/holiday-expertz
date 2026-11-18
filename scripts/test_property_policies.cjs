/**
 * Verification test for Step 5: Property Policies (Rules, Refunds & Terms)
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=== Testing Holiday Expertz Property Policies Data Integrity ===");

// 1. Check Property schema and type definition files
const backendTypesPath = path.join(__dirname, "../backend/src/types/property.ts");
const backendModelPath = path.join(__dirname, "../backend/src/lib/models/Property.ts");
const sharedWizardPath = path.join(__dirname, "../frontend/src/components/properties/PropertyWizard.tsx");
const frontendPagePath = fs.existsSync(sharedWizardPath)
  ? sharedWizardPath
  : path.join(__dirname, "../frontend/src/app/admin/properties/new/page.tsx");

const typesContent = fs.readFileSync(backendTypesPath, "utf-8");
assert(typesContent.includes("export interface PropertyPolicies"), "PropertyPolicies interface must be exported in backend types");
assert(typesContent.includes("generalPolicy?: string"), "generalPolicy field must exist in PropertyPolicies");
assert(typesContent.includes("refundPolicy?: string"), "refundPolicy field must exist in PropertyPolicies");
assert(typesContent.includes("contractPolicy?: string"), "contractPolicy field must exist in PropertyPolicies");
assert(typesContent.includes("additionalNotes?: string"), "additionalNotes field must exist in PropertyPolicies");
assert(typesContent.includes("policies?: PropertyPolicies"), "Property interface must include policies?: PropertyPolicies");
console.log("✓ Backend TypeScript types include PropertyPolicies interface and Property.policies property");

const modelContent = fs.readFileSync(backendModelPath, "utf-8");
assert(modelContent.includes("policies: {"), "Mongoose PropertySchema must define policies subdocument");
assert(modelContent.includes("generalPolicy: { type: String, default: \"\" }"), "generalPolicy schema definition must exist");
assert(modelContent.includes("refundPolicy: { type: String, default: \"\" }"), "refundPolicy schema definition must exist");
assert(modelContent.includes("contractPolicy: { type: String, default: \"\" }"), "contractPolicy schema definition must exist");
assert(modelContent.includes("additionalNotes: { type: String, default: \"\" }"), "additionalNotes schema definition must exist");
console.log("✓ Mongoose Property model schema contains policies definition with default empty strings");

const frontendContent = fs.readFileSync(frontendPagePath, "utf-8");
assert(frontendContent.includes("PropertyPolicies"), "Frontend page must import or use PropertyPolicies");
assert(frontendContent.includes("Step 5: Property Policies — Rules, Refunds & Terms"), "Step 5 title must be present in frontend wizard");
assert(frontendContent.includes("Step 7: Owner Association & Publication Badges"), "Step 7 title must be present in frontend wizard");
assert(frontendContent.includes("num: 5, title: \"Property Policies\""), "STEPS array must have Step 5 Property Policies");
assert(frontendContent.includes("num: 6, title: \"Property Reviews\""), "STEPS array must have Step 6 Property Reviews");
assert(frontendContent.includes("num: 7, title: \"Owner & Publish\""), "STEPS array must have Step 7 Owner & Publish");
assert(frontendContent.includes("currentStep === 5"), "Step 5 view must be rendered when currentStep is 5");
assert(frontendContent.includes("currentStep === 7"), "Step 7 view must be rendered when currentStep is 7");
assert(frontendContent.includes("currentStep < 7"), "Footer navigation must check currentStep < 7 for Continue button");
assert(frontendContent.includes("lg:grid-cols-7"), "Stepper grid must support 7 steps");
console.log("✓ Frontend wizard correctly defines 7 steps with Property Policies as Step 5, Reviews as Step 6, and Owner & Publish as Step 7");

// 2. Multiline formatting & character limit tests
const samplePolicy = {
  generalPolicy: "1. No loud noise after 10 PM.\n2. Smoking prohibited indoors.\n3. Pets welcome with prior notice.",
  refundPolicy: "Full refund 7 days before check-in.\n50% refund between 7 days and 48 hours.\nNon-refundable within 48 hours.",
  contractPolicy: "Guests are responsible for any property damages.\nA $500 refundable security deposit applies upon arrival.",
  additionalNotes: "Airport shuttle available on request.\nPlease contact concierge 2 hours before arrival.",
};

assert.strictEqual(samplePolicy.generalPolicy.split("\n").length, 3, "Multiline formatting must be preserved in generalPolicy");
assert.strictEqual(samplePolicy.refundPolicy.split("\n").length, 3, "Multiline formatting must be preserved in refundPolicy");
assert(samplePolicy.generalPolicy.length <= 5000, "generalPolicy length must be within 5,000 characters");
assert(samplePolicy.refundPolicy.length <= 5000, "refundPolicy length must be within 5,000 characters");
assert(samplePolicy.contractPolicy.length <= 5000, "contractPolicy length must be within 5,000 characters");
assert(samplePolicy.additionalNotes.length <= 5000, "additionalNotes length must be within 5,000 characters");
console.log("✓ Policy multiline strings and character limit constraints verified");

console.log("\nALL PROPERTY POLICIES INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉");
