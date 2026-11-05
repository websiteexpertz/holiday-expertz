import { NextRequest, NextResponse } from "next/server";
import { getPublishedBlogs } from "../../../../lib/storage/blogStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const featuredParam = searchParams.get("featured");
    const limitParam = searchParams.get("limit");
    const pageParam = searchParams.get("page");

    const result = getPublishedBlogs({
      categorySlug: categorySlug && categorySlug !== "all" ? categorySlug : undefined,
      search,
      featured: featuredParam === "true",
      limit: limitParam ? parseInt(limitParam, 10) : undefined,
      page: pageParam ? parseInt(pageParam, 10) : 1,
    });

    return NextResponse.json({
      success: true,
      blogs: result.blogs,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error("Public Blogs GET Error:", error);
    return NextResponse.json({ success: false, message: "Error fetching blogs" }, { status: 500 });
  }
}
