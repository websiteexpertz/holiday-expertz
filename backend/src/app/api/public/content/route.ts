import { NextResponse } from "next/server";
import { getWebsiteContent } from "../../../../lib/storage/contentStore";
import { getWebsiteSettings } from "../../../../lib/storage/settingsStore";

export async function GET() {
  try {
    const content = getWebsiteContent();
    const settings = getWebsiteSettings();
    return NextResponse.json({ success: true, content, settings });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching website content" }, { status: 500 });
  }
}
