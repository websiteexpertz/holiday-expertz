import { NextRequest, NextResponse } from "next/server";
import { getPublishedBlogBySlug, getRelatedBlogs } from "../../../../../lib/storage/blogStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, message: "Slug is required" }, { status: 400 });
    }

    const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
    const blog = getPublishedBlogBySlug(decodedSlug);

    if (!blog) {
      return NextResponse.json(
        { success: false, message: `Article with slug "${decodedSlug}" not found.` },
        { status: 404 }
      );
    }

    const related = getRelatedBlogs(blog.slug, blog.categorySlug, 3);

    return NextResponse.json({
      success: true,
      blog,
      relatedBlogs: related,
    });
  } catch (error) {
    console.error("Public Single Blog GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch article details" },
      { status: 500 }
    );
  }
}

