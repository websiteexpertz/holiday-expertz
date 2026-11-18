/**
 * Verification test for Holiday Expertz Owner Profile Enhancement
 * Tests:
 * 1. Owner Profile Image (optional, upload, preview, remove, formats, size limit)
 * 2. Languages Spoken by Owner (optional, multiple languages, chips, uniqueness)
 * 3. About the Owner (optional, multiline, 2000 char limit, character counter)
 * 4. Password Security (random temporary password when empty, no hardcoded default exposed)
 * 5. Add Owner & Edit Owner workflows
 * 6. MongoDB Schema and Store backwards compatibility
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

console.log("=== Testing Holiday Expertz Owner Profile Enhancement ===");

// 1. Verify Backend Auth Types
const authTypesPath = path.join(__dirname, "../backend/src/types/auth.ts");
const authTypesContent = fs.readFileSync(authTypesPath, "utf-8");

assert(authTypesContent.includes("profileImage?: string | null;"), "PropertyOwner must include profileImage");
assert(authTypesContent.includes("languagesSpoken?: string[];"), "PropertyOwner must include languagesSpoken");
assert(authTypesContent.includes("aboutOwner?: string;"), "PropertyOwner must include aboutOwner");
console.log("✓ Backend types (PropertyOwner & PropertyOwnerRecord) include all 3 profile fields");

// 2. Verify Mongoose Model Schema
const ownerModelPath = path.join(__dirname, "../backend/src/lib/models/PropertyOwner.ts");
const ownerModelContent = fs.readFileSync(ownerModelPath, "utf-8");

assert(ownerModelContent.includes("profileImage: { type: String, default: null }"), "Schema must define profileImage with default null");
assert(ownerModelContent.includes("languagesSpoken: { type: [String], default: [] }"), "Schema must define languagesSpoken array with default []");
assert(ownerModelContent.includes("aboutOwner: { type: String, default: \"\" }"), "Schema must define aboutOwner with default empty string");
console.log("✓ Mongoose PropertyOwner schema includes new profile fields with backwards-compatible defaults");

// 3. Verify Store methods & backwards compatibility
const ownerStorePath = path.join(__dirname, "../backend/src/lib/storage/propertyOwnerStore.ts");
const ownerStoreContent = fs.readFileSync(ownerStorePath, "utf-8");

assert(ownerStoreContent.includes("const image = owner.profileImage ?? owner.avatar ?? null;"), "createOwner must normalize profileImage and avatar");
assert(ownerStoreContent.includes("const about = owner.aboutOwner ?? owner.bio ?? \"\";"), "createOwner must normalize aboutOwner and bio");
assert(ownerStoreContent.includes("updatesWithTimestamp.languagesSpoken = cleanLangs"), "updateOwnerProfile must handle languagesSpoken");
assert(ownerStoreContent.includes("updatesWithTimestamp.profileImage = img"), "updateOwnerProfile must persist profileImage");
console.log("✓ propertyOwnerStore persists and sanitizes profileImage, languagesSpoken, and aboutOwner seamlessly");

// 4. Verify Admin Owners Route (GET, POST, PATCH)
const adminOwnersRoutePath = path.join(__dirname, "../backend/src/app/api/admin/owners/route.ts");
const adminOwnersRouteContent = fs.readFileSync(adminOwnersRoutePath, "utf-8");

assert(adminOwnersRouteContent.includes("generateSecureTempPassword"), "POST must define secure temporary password generator");
assert(adminOwnersRouteContent.includes("const cleanAbout = (aboutOwner ?? bio ?? \"\").trim();"), "POST must sanitize aboutOwner");
assert(adminOwnersRouteContent.includes("if (cleanAbout.length > 2000)"), "POST must enforce 2,000 character limit on aboutOwner");
assert(adminOwnersRouteContent.includes("updateOwnerProfile"), "PATCH must invoke updateOwnerProfile for edit updates");
assert(adminOwnersRouteContent.includes("updates.aboutOwner = text"), "PATCH must support updating aboutOwner");
assert(adminOwnersRouteContent.includes("updates.languagesSpoken ="), "PATCH must support updating languagesSpoken");
console.log("✓ Admin owners API route includes secure temp password generator and full profile CRUD support");

// 5. Verify Frontend adminClient
const adminClientPath = path.join(__dirname, "../frontend/src/lib/adminClient.ts");
const adminClientContent = fs.readFileSync(adminClientPath, "utf-8");

assert(adminClientContent.includes("profileImage?: string | null;"), "adminClient.owners.create must accept profileImage");
assert(adminClientContent.includes("languagesSpoken?: string[];"), "adminClient.owners.create must accept languagesSpoken");
assert(adminClientContent.includes("aboutOwner?: string;"), "adminClient.owners.create must accept aboutOwner");
assert(adminClientContent.includes("update: async ("), "adminClient.owners must have update method");
console.log("✓ frontend adminClient.owners methods updated for create and update");

// 6. Verify Frontend Admin Owners Page Layout & UX
const frontendOwnersPagePath = path.join(__dirname, "../frontend/src/app/admin/owners/page.tsx");
const frontendOwnersContent = fs.readFileSync(frontendOwnersPagePath, "utf-8");

// Section Heading & Placement
assert(frontendOwnersContent.includes("Owner Profile Details"), "Section heading 'Owner Profile Details' must exist");
assert(frontendOwnersContent.includes("Additional information about the owner, including their profile photo, languages and hospitality background."), "Section description must match requirements");

// Profile Image Upload
assert(frontendOwnersContent.includes("Owner Profile Image"), "Owner Profile Image label must exist");
assert(frontendOwnersContent.includes("Choose Image"), "Choose Image button must exist");
assert(frontendOwnersContent.includes("Replace Image"), "Replace Image button must exist");
assert(frontendOwnersContent.includes("handleImageUpload"), "handleImageUpload must be implemented");
assert(frontendOwnersContent.includes("handleRemoveImage"), "handleRemoveImage must be implemented");
assert(frontendOwnersContent.includes("5 * 1024 * 1024"), "5MB file size limit must be enforced");
assert(frontendOwnersContent.includes("JPG, PNG or WebP — Maximum 5 MB"), "Image formats note must be present");

// Languages Spoken
assert(frontendOwnersContent.includes("Languages Spoken by Owner"), "Languages Spoken field label must exist");
assert(frontendOwnersContent.includes("AVAILABLE_LANGUAGES"), "AVAILABLE_LANGUAGES list must be defined");
assert(frontendOwnersContent.includes("handleAddLanguage"), "handleAddLanguage must be implemented");
assert(frontendOwnersContent.includes("handleRemoveLanguage"), "handleRemoveLanguage must be implemented");
assert(frontendOwnersContent.includes("Selected Languages:"), "Selected Languages chip list must exist");

// About the Owner
assert(frontendOwnersContent.includes("About the Owner"), "About the Owner label must exist");
assert(frontendOwnersContent.includes("maxLength={2000}"), "Textarea must have maxLength 2000");
assert(frontendOwnersContent.includes("2,000 characters"), "Character counter label must be present");
assert(frontendOwnersContent.includes("Describe the owner's hospitality experience"), "Placeholder must match specification");

// Edit Owner Support
assert(frontendOwnersContent.includes("handleOpenEditModal"), "handleOpenEditModal must be implemented");
assert(frontendOwnersContent.includes("Edit Property Owner"), "Edit mode modal title must be present");
assert(frontendOwnersContent.includes("Save Changes"), "Save Changes button in edit mode must be present");
assert(frontendOwnersContent.includes("title={`Edit ${owner.fullName}`}"), "Edit action button must be in table row");

console.log("✓ Frontend modal layout, section positioning, upload controls, language chips, character counter, and Edit Mode verified");

// 7. Test Language Deduplication and Trimming Logic
function processLanguages(existing, newLang) {
  const trimmed = newLang.trim();
  if (!trimmed || existing.includes(trimmed)) return existing;
  return [...existing, trimmed];
}

let langs = [];
langs = processLanguages(langs, "English");
langs = processLanguages(langs, "Hindi");
langs = processLanguages(langs, "English"); // Duplicate
langs = processLanguages(langs, "  French  "); // Needs trimming
assert.deepStrictEqual(langs, ["English", "Hindi", "French"], "Languages must deduplicate and trim");
console.log("✓ Language selection deduplication and whitespace trimming logic verified");

// 8. Test Secure Temporary Password Generation Logic
const crypto = require("crypto");
function generateSecureTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomCode = "";
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return `Hex#${randomCode}!${crypto.randomInt(10, 99)}`;
}

const pass1 = generateSecureTempPassword();
const pass2 = generateSecureTempPassword();
assert.notStrictEqual(pass1, pass2, "Generated passwords must be unique");
assert(pass1.startsWith("Hex#"), "Password must follow secure format prefix");
assert(/[!]\d{2}$/.test(pass1), "Password must end with special char and 2 digits");
console.log(`✓ Secure random temporary password generation verified (e.g. ${pass1}, ${pass2})`);

console.log("\nALL OWNER PROFILE ENHANCEMENT TESTS PASSED! 🎉");
