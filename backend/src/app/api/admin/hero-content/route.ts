import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import {
  getHeroBannerContent,
  updateHeroBannerContentSlot,
  updateAllHeroBannerContentSlots,
} from "../../../../lib/storage/heroContentStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const heroContent = getHeroBannerContent();
    return NextResponse.json({ success: true, heroContent });
  } catch (error) {
    console.error("Admin Hero Content GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch hero banner content" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "content.update")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    let updated;
    if (body.slideNumber !== undefined) {
      // Single slide update
      updated = updateHeroBannerContentSlot(body.slideNumber, {
        heading: body.heading,
        description: body.description,
      });

      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "website_content",
        action: "update_hero_content_slide",
        details: `Updated Hero Banner text for Slide ${body.slideNumber}: "${body.heading}"`,
        status: "success",
      });
    } else if (Array.isArray(body.slots)) {
      // Multiple / All slides update
      updated = updateAllHeroBannerContentSlots(body.slots);

      recordAuditLog({
        adminId: admin.id,
        adminName: admin.fullName,
        adminEmail: admin.email,
        module: "website_content",
        action: "update_all_hero_content_slides",
        details: "Updated all 4 Hero Banner content slots",
        status: "success",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid payload. Provide slideNumber or slots array." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, heroContent: updated });
  } catch (error: any) {
    console.error("Admin Hero Content PUT Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update hero banner content" },
      { status: 400 }
    );
  }
}

