import { NextResponse } from "next/server";
import { getActiveCategories } from "../../../../lib/storage/blogCategoryStore";
import { getCategoryBlogCounts } from "../../../../lib/storage/blogStore";

export async function GET() {
  try {
    const categories = getActiveCategories();
    const counts = getCategoryBlogCounts();

    const withCounts = categories.map((cat) => ({
      ...cat,
      blogCount: counts[cat.slug] || 0,
    }));

    return NextResponse.json({
      success: true,
      categories: withCounts,
    });
  } catch (error) {
    console.error("Public Blog Categories GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blog categories" },
      { status: 500 }
    );
  }
}

