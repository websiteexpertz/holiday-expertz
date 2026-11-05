import { NextResponse } from "next/server";
import { createInquiry } from "../../../../lib/storage/inquiryStore";

function sanitize(input: any): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Support international codes e.g. +91 98765 43210, +1 (555) 000-0000, 9876543210
  // Digits count must be between 6 and 16
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 16;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const firstName = sanitize(body.firstName);
    const lastName = sanitize(body.lastName);
    const email = sanitize(body.email).toLowerCase();
    const phone = sanitize(body.phone);
    const message = sanitize(body.message);
    const subject = sanitize(body.subject) || "Website Contact Form Inquiry";

    // Validation
    if (!firstName) {
      return NextResponse.json(
        { success: false, message: "First name is required." },
        { status: 400 }
      );
    }

    if (!lastName) {
      return NextResponse.json(
        { success: false, message: "Last name is required." },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid contact phone number with country code." },
        { status: 400 }
      );
    }

    if (!message || message.length < 5) {
      return NextResponse.json(
        { success: false, message: "Please enter a message of at least 5 characters." },
        { status: 400 }
      );
    }

    const fullName = sanitize(body.name) || `${firstName} ${lastName}`.trim();

    const inquiry = createInquiry({
      name: fullName,
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      relatedPropertyId: sanitize(body.relatedPropertyId) || undefined,
      relatedPropertyName: sanitize(body.relatedPropertyName) || undefined,
    });

    // Email Notification hook
    const notificationEmail =
      process.env.CONTACT_NOTIFICATION_EMAIL ||
      process.env.SUPPORT_EMAIL ||
      "concierge@holidayexpertz.com";

    // Safe dispatch log for auditing and configured integrations
    console.log(
      `[CONTACT INQUIRY RECEIVED] ID: ${inquiry.id} | From: ${fullName} <${email}> (${phone}) | Route: ${notificationEmail}`
    );

    return NextResponse.json({
      success: true,
      message: "Thank you for contacting Holiday Expertz! Your message has been received. Our team will get back to you shortly.",
      inquiry,
    });
  } catch (error: any) {
    console.error("Public Inquiries POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
