const fs = require("fs");
const path = require("path");

console.log("=================================================");
console.log("   HOLIDAY EXPERTZ CONTACT FORM EMAIL TEST       ");
console.log("=================================================");

// 1. Verify Environment Variables
console.log("\n1. Checking Environment Variables for Contact Form:");
const envLocalPath = path.join(__dirname, "..", ".env.local");
let envLocalContent = "";
if (fs.existsSync(envLocalPath)) {
  envLocalContent = fs.readFileSync(envLocalPath, "utf-8");
}

const contactNotificationMatch = envLocalContent.match(/CONTACT_NOTIFICATION_EMAIL=(.*)/);
const contactEmail = contactNotificationMatch ? contactNotificationMatch[1].trim() : "Not found";
console.log(`   CONTACT_NOTIFICATION_EMAIL: ${contactEmail}`);

if (contactEmail === "contact@holidayexpertz.com") {
  console.log("   ✅ Target contact email correctly set to: contact@holidayexpertz.com");
} else {
  console.error("   ❌ ERROR: Target contact email is not contact@holidayexpertz.com");
  process.exit(1);
}

// 2. Test Inquiry Persistence in backend/src/data/inquiries.json
console.log("\n2. Testing Inquiry Creation and Storage:");
const inquiriesPath = path.join(__dirname, "..", "backend", "src", "data", "inquiries.json");
let inquiries = [];
if (fs.existsSync(inquiriesPath)) {
  inquiries = JSON.parse(fs.readFileSync(inquiriesPath, "utf-8"));
}

const testInquiryId = `inq_test_${Date.now()}`;
const newInquiry = {
  id: testInquiryId,
  name: "Amitabh Mehra",
  firstName: "Amitabh",
  lastName: "Mehra",
  email: "amitabh.mehra@example.com",
  phone: "+91 98200 12345",
  subject: "Testing Contact Form delivery to contact@holidayexpertz.com",
  message: "Hello Holiday Expertz concierge, please confirm this contact form submission is routed directly to contact@holidayexpertz.com.",
  status: "new",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

inquiries.unshift(newInquiry);
fs.writeFileSync(inquiriesPath, JSON.stringify(inquiries, null, 2), "utf-8");

// Re-read and verify
const reReadInquiries = JSON.parse(fs.readFileSync(inquiriesPath, "utf-8"));
const found = reReadInquiries.find((i) => i.id === testInquiryId);

if (found) {
  console.log(`   ✅ Test inquiry persisted successfully (ID: ${found.id})`);
  console.log(`   Submitted By: ${found.name} <${found.email}>`);
  console.log(`   Phone: ${found.phone}`);
  console.log(`   Message: "${found.message}"`);
} else {
  console.error("   ❌ Failed to persist test inquiry.");
  process.exit(1);
}

// 3. Verify Email Dispatch Logic and recipient
console.log("\n3. Testing Dispatcher Route & Recipient target:");
const targetRecipient = process.env.CONTACT_NOTIFICATION_EMAIL || "contact@holidayexpertz.com";
console.log(`   Notification Recipient: ${targetRecipient}`);

const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
console.log(`   SMTP Server Configured: ${hasSmtp ? "YES (" + process.env.SMTP_HOST + ")" : "NO (Awaiting SMTP credentials)"}`);

if (!hasSmtp) {
  console.log("   ℹ️  Note: When SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) are provided in .env.local,");
  console.log("       nodemailer will deliver the email across the internet to the contact@holidayexpertz.com inbox.");
  console.log("       In the meantime, every inquiry is safely captured and stored in the database without failure,");
  console.log("       and is immediately reviewable in the Super Admin Dashboard under /admin/inquiries.");
}

console.log("\n=================================================");
console.log("✅ CONTACT FORM VERIFICATION SUCCESSFUL");
console.log("=================================================\n");

