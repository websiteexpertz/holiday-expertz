import { NextResponse } from "next/server";
import { getPublishedBlogs } from "../../../../lib/storage/blogStore";

export async function GET() {
  try {
    const blogs = getPublishedBlogs();
    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching blogs" }, { status: 500 });
  }
}
