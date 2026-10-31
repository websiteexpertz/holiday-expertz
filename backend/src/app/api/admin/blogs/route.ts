import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllBlogs, createBlog, updateBlog, deleteBlog, getBlogById } from "../../../../lib/storage/blogStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const blogs = getAllBlogs();
    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    console.error("Admin Blogs GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "blogs.create")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title || !body.content || !body.excerpt) {
      return NextResponse.json({ success: false, message: "Title, excerpt, and content are required" }, { status: 400 });
    }

    const blog = createBlog({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      featuredImage: body.featuredImage || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      category: body.category || "Travel Guide",
      author: body.author || admin.fullName,
      authorAvatar: body.authorAvatar || admin.avatar,
      readTime: body.readTime || "5 min read",
      status: body.status || "draft",
      featured: Boolean(body.featured),
      tags: Array.isArray(body.tags) ? body.tags : [],
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
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
  } catch (error) {
    console.error("Admin Blogs POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to create blog" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "blogs.update")) {
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
      details: `Updated blog post "${updated.title}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, blog: updated });
  } catch (error) {
    console.error("Admin Blogs PUT Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "blogs.delete")) {
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
  } catch (error) {
    console.error("Admin Blogs DELETE Error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete blog" }, { status: 500 });
  }
}
