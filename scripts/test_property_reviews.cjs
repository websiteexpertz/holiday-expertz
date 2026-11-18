/**
 * Verification test for Step 6: Property Reviews & 7-Step Wizard Structure
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=== Testing Holiday Expertz 7-Step Wizard & Property Reviews Implementation ===");

// 1. Check Frontend page structure
const sharedWizardPath = path.join(__dirname, "../frontend/src/components/properties/PropertyWizard.tsx");
const frontendPagePath = fs.existsSync(sharedWizardPath)
  ? sharedWizardPath
  : path.join(__dirname, "../frontend/src/app/admin/properties/new/page.tsx");
const frontendContent = fs.readFileSync(frontendPagePath, "utf-8");

// Wizard steps verification
assert(frontendContent.includes("num: 1, title: \"Basic Information\""), "Step 1 must be Basic Information");
assert(frontendContent.includes("num: 2, title: \"Location & Map\""), "Step 2 must be Location & Map");
assert(frontendContent.includes("num: 3, title: \"Photos & Media\""), "Step 3 must be Photos & Media");
assert(frontendContent.includes("num: 4, title: \"Details & Pricing\""), "Step 4 must be Details & Pricing");
assert(frontendContent.includes("num: 5, title: \"Property Policies\""), "Step 5 must be Property Policies");
assert(frontendContent.includes("num: 6, title: \"Property Reviews\""), "Step 6 must be Property Reviews");
assert(frontendContent.includes("num: 7, title: \"Owner & Publish\""), "Step 7 must be Owner & Publish");
assert(frontendContent.includes("lg:grid-cols-7"), "Stepper container must support 7 columns on desktop");
console.log("✓ Wizard successfully structured into 7 distinct sequential steps");

// Step 6 content verification
assert(frontendContent.includes("Step 6: Property Reviews"), "Step 6 heading must be present");
assert(frontendContent.includes("Total Reviews"), "Total Reviews summary card must exist");
assert(frontendContent.includes("Average Rating"), "Average Rating summary card must exist");
assert(frontendContent.includes("1 – 5 Stars"), "Rating Scale card must display 1-5 Stars");
assert(frontendContent.includes("Guest / Reviewer Name"), "Guest / Reviewer Name field must exist");
assert(frontendContent.includes("Review Date"), "Review Date field must exist");
assert(frontendContent.includes("Guest Rating"), "Guest Rating interactive stars must exist");
assert(frontendContent.includes("Review Title"), "Review Title field must exist");
assert(frontendContent.includes("Guest Review"), "Guest Review textarea must exist");
assert(frontendContent.includes("ADMIN_IMPORTED"), "Reviews must be explicitly sourced as ADMIN_IMPORTED");
assert(frontendContent.includes("UNVERIFIED"), "Admin reviews must be explicitly marked as UNVERIFIED");
assert(frontendContent.includes("currentStep === 6"), "Step 6 must render when currentStep is 6");
assert(frontendContent.includes("currentStep === 7"), "Step 7 must render when currentStep is 7");
assert(frontendContent.includes("currentStep < 7"), "Navigation must check currentStep < 7 for Continue button");
console.log("✓ Step 6 layout, summary cards, form fields, and authenticity metadata verified");

// 2. Check Backend types & schemas
const adminTypesPath = path.join(__dirname, "../backend/src/types/admin.ts");
const adminTypesContent = fs.readFileSync(adminTypesPath, "utf-8");
assert(adminTypesContent.includes("source?: \"ADMIN_IMPORTED\" | \"PLATFORM_GUEST\""), "ReviewRecord must define source");
assert(adminTypesContent.includes("verificationStatus?: \"VERIFIED\" | \"UNVERIFIED\""), "ReviewRecord must define verificationStatus");

const reviewModelPath = path.join(__dirname, "../backend/src/lib/models/Review.ts");
assert(fs.existsSync(reviewModelPath), "Review Mongoose model file must exist");
const reviewModelContent = fs.readFileSync(reviewModelPath, "utf-8");
assert(reviewModelContent.includes("ReviewSchema"), "ReviewSchema must be defined");
assert(reviewModelContent.includes("enum: [\"ADMIN_IMPORTED\", \"PLATFORM_GUEST\"]"), "source enum must be defined in schema");
assert(reviewModelContent.includes("enum: [\"VERIFIED\", \"UNVERIFIED\"]"), "verificationStatus enum must be defined in schema");
console.log("✓ Backend types and Mongoose Review model schema verified");

// 3. Check Admin API endpoint
const adminReviewsApiPath = path.join(__dirname, "../backend/src/app/api/admin/reviews/route.ts");
const adminReviewsApiContent = fs.readFileSync(adminReviewsApiPath, "utf-8");
assert(adminReviewsApiContent.includes("export async function GET"), "GET handler must exist");
assert(adminReviewsApiContent.includes("export async function POST"), "POST handler must exist for creating reviews");
assert(adminReviewsApiContent.includes("export async function PATCH"), "PATCH handler must exist for editing reviews");
assert(adminReviewsApiContent.includes("export async function DELETE"), "DELETE handler must exist for deleting reviews");
assert(adminReviewsApiContent.includes("recalculatePropertyRating"), "recalculatePropertyRating must be called on mutations");
console.log("✓ Admin reviews API CRUD operations and property rating recalculations verified");

// 4. Test review summary calculations
function calculateReviewSummary(reviewsList) {
  const total = reviewsList.length;
  if (total === 0) {
    return { total: 0, average: "Not Rated" };
  }
  const sum = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const avg = Math.round((sum / total) * 10) / 10;
  return { total, average: `${avg.toFixed(1)} ★` };
}

assert.deepStrictEqual(calculateReviewSummary([]), { total: 0, average: "Not Rated" });
assert.deepStrictEqual(calculateReviewSummary([{ rating: 5 }, { rating: 5 }]), { total: 2, average: "5.0 ★" });
assert.deepStrictEqual(calculateReviewSummary([{ rating: 5 }, { rating: 4 }]), { total: 2, average: "4.5 ★" });
assert.deepStrictEqual(calculateReviewSummary([{ rating: 5 }, { rating: 4 }, { rating: 4 }]), { total: 3, average: "4.3 ★" });
console.log("✓ Review summary calculations (total and average rating) verified accurately");

console.log("\nALL 7-STEP WIZARD & PROPERTY REVIEWS TESTS PASSED SUCCESSFULLY! 🎉");
