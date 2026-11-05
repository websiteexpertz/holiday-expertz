import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  findCategoryById,
} from "../../../../lib/storage/blogCategoryStore";
import { getAllBlogs, saveBlogs, getCategoryBlogCounts } from "../../../../lib/storage/blogStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "blogs.view")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const categories = getAllCategories();
    const counts = getCategoryBlogCounts();

    const enriched = categories.map((c) => ({
      ...c,
      blogCount: counts[c.slug] || 0,
    }));

    return NextResponse.json({ success: true, categories: enriched });
  } catch (error) {
    console.error("Admin Blog Categories GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "blogs.create")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, message: "Category name is required" }, { status: 400 });
    }

    const category = createCategory({
      name: body.name,
      slug: body.slug,
      description: body.description,
      image: body.image,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      order: body.order ? Number(body.order) : undefined,
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "blog_management",
      action: "create_category",
      resourceId: category.id,
      resourceType: "blog_category",
      details: `Created blog category "${category.name}" (${category.slug})`,
      status: "success",
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error("Admin Blog Categories POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create category" },
      { status: 400 }
    );
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
      return NextResponse.json({ success: false, message: "Category ID is required" }, { status: 400 });
    }

    const updated = updateCategory(id, updates);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "blog_management",
      action: "update_category",
      resourceId: id,
      resourceType: "blog_category",
      details: `Updated blog category "${updated.name}"`,
      status: "success",
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error("Admin Blog Categories PUT Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update category" },
      { status: 400 }
    );
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
    const reassignToSlug = searchParams.get("reassignTo");

    if (!id) {
      return NextResponse.json({ success: false, message: "Category ID is required" }, { status: 400 });
    }

    const category = findCategoryById(id);
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    const allBlogs = getAllBlogs();
    const assignedBlogs = allBlogs.filter((b) => (b.categorySlug || "").toLowerCase() === category.slug.toLowerCase());

    if (assignedBlogs.length > 0) {
      if (!reassignToSlug) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot delete "${category.name}". There are ${assignedBlogs.length} articles assigned to it. Please reassign them first or provide a target category slug.`,
            assignedCount: assignedBlogs.length,
          },
          { status: 400 }
        );
      }

      // Reassign blogs to target category
      const targetCat = getAllCategories().find((c) => c.slug.toLowerCase() === reassignToSlug.toLowerCase());
      if (!targetCat) {
        return NextResponse.json(
          { success: false, message: `Target reassignment category "${reassignToSlug}" does not exist.` },
          { status: 400 }
        );
      }

      for (const blog of assignedBlogs) {
        blog.category = targetCat.name;
        blog.categorySlug = targetCat.slug;
      }
      saveBlogs(allBlogs);
    }

    deleteCategory(id);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "blog_management",
      action: "delete_category",
      resourceId: id,
      resourceType: "blog_category",
      details: `Deleted blog category "${category.name}" (reassigned ${assignedBlogs.length} blogs to "${reassignToSlug || "none"}")`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Admin Blog Categories DELETE Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
