import { POST } from "../app/api/public/inquiries/route";
import { getInquiryById } from "../lib/storage/inquiryStore";

async function runTest() {
  console.log("=================================================");
  console.log("   HOLIDAY EXPERTZ CONTACT FORM VERIFICATION    ");
  console.log("=================================================");

  const testPayload = {
    firstName: "Pooja",
    lastName: "Sharma",
    email: "pooja.sharma.test@gmail.com",
    phone: "+91 98765 43210",
    subject: "Test Inquiry for contact@holidayexpertz.com",
    message: "This is a verification test of the contact form routing to contact@holidayexpertz.com. Please confirm receipt.",
    relatedPropertyName: "Royal Heritage Palace",
  };

  console.log("\n1. Simulating Form Submission with payload:");
  console.log(JSON.stringify(testPayload, null, 2));

  const req = new Request("http://localhost:3000/api/public/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload),
  });

  const response = await POST(req);
  const status = response.status;
  const result = await response.json();

  console.log(`\n2. API Route Response (Status: ${status}):`);
  console.log(JSON.stringify(result, null, 2));

  if (status !== 200 || !result.success) {
    console.error("\n❌ FAILED: API rejected the contact form submission.");
    process.exit(1);
  }

  console.log("\n3. Verifying persistence in Storage / Database:");
  const savedInquiry = getInquiryById(result.inquiry.id);
  if (!savedInquiry) {
    console.error("\n❌ FAILED: Inquiry ID was not found in database.");
    process.exit(1);
  }
  console.log("✅ Verified: Inquiry successfully saved with ID:", savedInquiry.id);
  console.log("   Name:", savedInquiry.name);
  console.log("   Sender Email:", savedInquiry.email);
  console.log("   Phone:", savedInquiry.phone);
  console.log("   Status:", savedInquiry.status);

  console.log("\n4. Verifying Email Dispatch Configuration:");
  console.log("   Configured Recipient:", result.emailDispatch?.recipient);
  console.log("   Dispatch Status:", result.emailDispatch?.delivered ? "DELIVERED via SMTP" : "RECORDED / NOTICE");
  console.log("   Dispatch Details:", result.emailDispatch?.note);

  if (result.emailDispatch?.recipient !== "contact@holidayexpertz.com") {
    console.error(`\n❌ FAILED: Expected recipient contact@holidayexpertz.com but got ${result.emailDispatch?.recipient}`);
    process.exit(1);
  }

  console.log("\n=================================================");
  console.log("✅ CONTACT FORM VERIFICATION COMPLETE: ALL PASS");
  console.log("=================================================\n");
}

runTest().catch((err) => {
  console.error("Test encountered an error:", err);
  process.exit(1);
});

