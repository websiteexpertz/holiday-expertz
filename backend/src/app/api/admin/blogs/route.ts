import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllBlogs, createBlog, updateBlog, deleteBlog, getBlogById } from "../../../../lib/storage/blogStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

function hasBlogPermission(admin: any, action: "view" | "create" | "update" | "delete"): boolean {
  return checkAdminPermission(admin, `blogs.${action}`);
}

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let blogs = getAllBlogs();

    if (category && category !== "all") {
      const catLower = category.toLowerCase();
      blogs = blogs.filter(
        (b) =>
          (b.categorySlug || "").toLowerCase() === catLower ||
          b.category.toLowerCase() === catLower
      );
    }

    if (status && status !== "all") {
      blogs = blogs.filter((b) => b.status === status);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      blogs = blogs.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.excerpt.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    console.error("Admin Blogs GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !hasBlogPermission(admin, "create")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        { success: false, message: "Title and content are required" },
        { status: 400 }
      );
    }

    const excerpt = body.excerpt?.trim() || body.content.slice(0, 160).replace(/[#*_]/g, "") + "...";
    const slug = body.slug || body.title;

    const blog = createBlog({
      title: body.title.trim(),
      slug,
      excerpt,
      content: body.content,
      featuredImage:
        body.featuredImage ||
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      category: body.category || "Destination Guides",
      categorySlug: body.categorySlug,
      author: body.author || admin.fullName || "HolidayExpertz Editorial",
      authorAvatar: body.authorAvatar || admin.avatar,
      authorRole: body.authorRole || "Editorial Writer",
      readTime: body.readTime || "5 min read",
      status: body.status || "draft",
      featured: Boolean(body.featured),
      isInformative: Boolean(body.isInformative),
      tags: Array.isArray(body.tags) ? body.tags : [],
      additionalImages: Array.isArray(body.additionalImages) ? body.additionalImages : [],
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      focusKeyword: body.focusKeyword,
      canonicalUrl: body.canonicalUrl,
      ogImage: body.ogImage || body.featuredImage,
      publishedAt: body.publishedAt,
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "blog_management",
      action: "create_blog",
      resourceId: blog.id,
      resourceType: "blog",
      details: `Created blog post "${blog.title}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, blog });
  } catch (error: any) {
    console.error("Admin Blogs POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create blog" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !hasBlogPermission(admin, "update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Blog ID required" }, { status: 400 });
    }

    const updated = updateBlog(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "blog_management",
      action: "update_blog",
      resourceId: id,
      resourceType: "blog",
      details: `Updated blog post "${updated.title}" (status: ${updated.status})`,
      status: "success",
    });

    return NextResponse.json({ success: true, blog: updated });
  } catch (error: any) {
    console.error("Admin Blogs PUT Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update blog" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !hasBlogPermission(admin, "delete")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "Blog ID required" }, { status: 400 });
    }

    const blog = getBlogById(id);
    if (!blog) {
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }
    deleteBlog(id);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "blog_management",
      action: "delete_blog",
      resourceId: id,
      resourceType: "blog",
      details: `Deleted blog "${blog?.title || id}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error: any) {
    console.error("Admin Blogs DELETE Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete blog" },
      { status: 500 }
    );
  }
}
