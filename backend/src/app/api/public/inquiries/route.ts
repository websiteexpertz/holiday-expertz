import { NextResponse } from "next/server";
import { createInquiry } from "../../../../lib/storage/inquiryStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message, relatedPropertyId, relatedPropertyName } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: "Name, email, and message are required" }, { status: 400 });
    }

    const inquiry = createInquiry({
      name,
      email,
      phone,
      subject: subject || "Website Contact Form Inquiry",
      message,
      relatedPropertyId,
      relatedPropertyName,
    });

    return NextResponse.json({ success: true, message: "Inquiry submitted successfully", inquiry });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to submit inquiry" }, { status: 500 });
  }
}
