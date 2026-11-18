import { NextResponse } from "next/server";
import { createInquiry } from "../../../../lib/storage/inquiryStore";
import {
  sendInquiryNotificationEmail,
  sendPropertyInquiryNotificationEmail,
} from "../../../../lib/services/emailService";
import { getPropertyById } from "../../../../lib/storage/propertyStore";

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

    const isPropertyInquiry = Boolean(
      body.propertyId ||
      body.relatedPropertyId ||
      body.type === "property_inquiry" ||
      body.checkInDate ||
      body.checkIn
    );

    // ─────────────────────────────────────────────────────────────
    // BRANCH A: PROPERTY SPECIFIC INQUIRY
    // ─────────────────────────────────────────────────────────────
    if (isPropertyInquiry) {
      const propId = sanitize(body.propertyId || body.relatedPropertyId);
      const property = propId ? getPropertyById(propId) : undefined;

      const name = sanitize(body.name || body.guestName || `${body.firstName || ""} ${body.lastName || ""}`.trim());
      const email = sanitize(body.email || body.guestEmail).toLowerCase();
      const phone = sanitize(body.phone || body.guestPhone);
      const checkInDate = sanitize(body.checkInDate || body.checkIn);
      const checkOutDate = sanitize(body.checkOutDate || body.checkOut);
      const rawGuests = body.guestCount || body.guests || 1;
      const guestCount = parseInt(String(rawGuests), 10);
      const message = sanitize(body.message || body.guestMessage);

      // Validation
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Your full name is required." },
          { status: 400 }
        );
      }

      if (!email || !isValidEmail(email)) {
        return NextResponse.json(
          { success: false, message: "Please provide a valid email address." },
          { status: 400 }
        );
      }

      if (phone && !isValidPhone(phone)) {
        return NextResponse.json(
          { success: false, message: "Please provide a valid mobile or WhatsApp number with country code." },
          { status: 400 }
        );
      }

      if (!checkInDate || !checkOutDate) {
        return NextResponse.json(
          { success: false, message: "Check-in and Check-out dates are required." },
          { status: 400 }
        );
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
        return NextResponse.json(
          { success: false, message: "Please provide dates in YYYY-MM-DD format." },
          { status: 400 }
        );
      }

      const todayStr = new Date().toISOString().split("T")[0];
      if (checkInDate < todayStr) {
        return NextResponse.json(
          { success: false, message: "Check-in date cannot be in the past." },
          { status: 400 }
        );
      }

      if (checkOutDate <= checkInDate) {
        return NextResponse.json(
          { success: false, message: "Check-out date must be later than check-in date." },
          { status: 400 }
        );
      }

      if (isNaN(guestCount) || guestCount < 1) {
        return NextResponse.json(
          { success: false, message: "Please select at least 1 guest." },
          { status: 400 }
        );
      }

      const maxAllowedGuests = property?.capacity?.maxGuests || 20;
      if (guestCount > maxAllowedGuests) {
        return NextResponse.json(
          { success: false, message: `Guest count (${guestCount}) exceeds maximum property capacity of ${maxAllowedGuests}.` },
          { status: 400 }
        );
      }

      const propertyName = property?.name || sanitize(body.propertyName) || "Luxury Vacation Rental";
      const propertyNumber = property?.propertyNumber || "";
      const propertyLocation = property?.location
        ? [property.location.city, property.location.state, property.location.country].filter(Boolean).join(", ")
        : "";
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://holiday-expertz.vercel.app";
      const propertyUrl = `${baseUrl}/properties/${property?.id || propId}`;

      const subject = propertyNumber
        ? `New Property Inquiry — ${propertyName} — ${propertyNumber}`
        : `New Property Inquiry — ${propertyName}`;

      const nameParts = name.split(" ");
      const firstName = nameParts[0] || name;
      const lastName = nameParts.slice(1).join(" ") || "";

      const inquiry = createInquiry({
        name,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        subject,
        message: message || "Interested in staying at this property.",
        relatedPropertyId: property?.id || propId || undefined,
        relatedPropertyName: propertyName,
        propertyNumber: propertyNumber || undefined,
        propertyLocation: propertyLocation || undefined,
        propertyUrl,
        ownerId: property?.ownerId || undefined,
        checkInDate,
        checkOutDate,
        guestCount,
        type: "property_inquiry",
      });

      // Dispatch property inquiry email notification via the same Contact Us email infrastructure
      const emailResult = await sendPropertyInquiryNotificationEmail(inquiry);

      return NextResponse.json({
        success: true,
        message: "Your inquiry has been submitted successfully. Our team will review your request and get back to you.",
        inquiry,
        emailDispatch: {
          recipient: emailResult.recipient,
          delivered: emailResult.delivered,
          attempted: emailResult.attempted,
          note: emailResult.note || (emailResult.delivered ? "Email successfully delivered to inbox" : emailResult.error),
        },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // BRANCH B: GENERAL WEBSITE CONTACT FORM
    // ─────────────────────────────────────────────────────────────
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
      type: "contact",
    });

    // Trigger automated email notification to contact@holidayexpertz.com
    const emailResult = await sendInquiryNotificationEmail(inquiry);

    return NextResponse.json({
      success: true,
      message: "Thank you for contacting Holiday Expertz! Your message has been received. Our team will get back to you shortly.",
      inquiry,
      emailDispatch: {
        recipient: emailResult.recipient,
        delivered: emailResult.delivered,
        attempted: emailResult.attempted,
        note: emailResult.note || (emailResult.delivered ? "Email successfully delivered to inbox" : emailResult.error),
      },
    });
  } catch (error: any) {
    console.error("Public Inquiries POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
