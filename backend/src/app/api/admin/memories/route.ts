import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getAllMemories,
  getMemoryById,
  createMemory,
  updateMemory,
  deleteMemory,
  reorderMemories,
  clearDemoMemories,
} from "../../../../lib/storage/memoryStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";
import { MemoryInput } from "../../../../types/memory";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search")?.toLowerCase().trim();
    const isPublished = searchParams.get("isPublished");

    let memories = getAllMemories(true);

    if (status && status !== "all") {
      memories = memories.filter((m) => m.status === status);
    }

    if (source && source !== "all") {
      memories = memories.filter((m) => m.source === source);
    }

    if (isPublished !== null && isPublished !== undefined && isPublished !== "all") {
      const pubBool = isPublished === "true";
      memories = memories.filter((m) => m.isPublished === pubBool);
    }

    if (search) {
      memories = memories.filter(
        (m) =>
          m.title.toLowerCase().includes(search) ||
          m.guestName.toLowerCase().includes(search) ||
          m.destinationName.toLowerCase().includes(search) ||
          (m.guestEmail && m.guestEmail.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      memories,
      total: memories.length,
    });
  } catch (error) {
    console.error("Admin Memories GET API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve memories." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || !body.guestName || !body.destinationName) {
      return NextResponse.json(
        { success: false, message: "Title, traveller name, and destination name are required." },
        { status: 400 }
      );
    }

    const memory = createMemory({
      ...body,
      source: "admin_created",
      status: body.status || "approved",
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    });

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "memories_management",
      action: "create_memory",
      resourceId: memory.id,
      resourceType: "memory",
      details: `Created new memory: ${memory.title}`,
      status: "success",
    });

    return NextResponse.json(
      { success: true, message: "Memory created successfully!", memory },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin Memories POST API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create memory." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, orderedIds, ...updates } = body;

    // Handle reorder
    if (action === "reorder" && Array.isArray(orderedIds)) {
      const reordered = reorderMemories(orderedIds);
      return NextResponse.json({ success: true, memories: reordered });
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "Memory ID is required." }, { status: 400 });
    }

    const existing = getMemoryById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Memory not found." }, { status: 404 });
    }

    let payloadToUpdate: Partial<MemoryInput> = { ...updates };

    if (action === "approve") {
      payloadToUpdate = { status: "approved", isPublished: true };
    } else if (action === "reject") {
      payloadToUpdate = { status: "rejected", isPublished: false, rejectionReason: body.rejectionReason };
    } else if (action === "toggle_publish") {
      payloadToUpdate = { isPublished: !existing.isPublished };
    } else if (action === "toggle_active") {
      payloadToUpdate = { isActive: !existing.isActive };
    }

    const updated = updateMemory(id, payloadToUpdate);

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "memories_management",
      action: `update_memory_${action || "edit"}`,
      resourceId: id,
      resourceType: "memory",
      details: `Updated memory: ${existing.title} (Action: ${action || "edit"})`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Memory updated successfully!",
      memory: updated,
    });
  } catch (error) {
    console.error("Admin Memories PATCH API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update memory." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const cleanDemo = searchParams.get("cleanDemo");

    // Clear demo records only
    if (cleanDemo === "true") {
      const deletedCount = clearDemoMemories();
      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "memories_management",
        action: "clean_demo_memories",
        resourceId: "all_demo",
        resourceType: "memory",
        details: `Cleaned up ${deletedCount} demo memories.`,
        status: "success",
      });
      return NextResponse.json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} demo memories. Genuine submissions were preserved.`,
        deletedCount,
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "Memory ID is required." }, { status: 400 });
    }

    const success = deleteMemory(id);
    if (!success) {
      return NextResponse.json({ success: false, message: "Memory not found." }, { status: 404 });
    }

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "memories_management",
      action: "delete_memory",
      resourceId: id,
      resourceType: "memory",
      details: `Deleted memory: ${id}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: "Memory deleted successfully.",
    });
  } catch (error) {
    console.error("Admin Memories DELETE API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete memory." },
      { status: 500 }
    );
  }
}
