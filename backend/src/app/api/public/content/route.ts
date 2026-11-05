import { NextResponse } from "next/server";
import { getWebsiteContent } from "../../../../lib/storage/contentStore";
import { getWebsiteSettings } from "../../../../lib/storage/settingsStore";
import { getHeroBannerContent } from "../../../../lib/storage/heroContentStore";

export async function GET() {
  try {
    const content = getWebsiteContent();
    const settings = getWebsiteSettings();
    const heroContent = getHeroBannerContent();
    return NextResponse.json({ success: true, content, settings, heroContent });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching website content" }, { status: 500 });
  }
}
