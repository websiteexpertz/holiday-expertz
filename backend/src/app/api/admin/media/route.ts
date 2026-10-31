import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAuthenticatedAdmin, checkAdminPermission } from "../../../../lib/security/adminAuthService";
import { getAllProperties } from "../../../../lib/storage/propertyStore";
import { getAllBlogs } from "../../../../lib/storage/blogStore";
import { getAllEvents } from "../../../../lib/storage/eventStore";
import { getAllDeals } from "../../../../lib/storage/dealStore";
import { recordAuditLog } from "../../../../lib/storage/auditLogStore";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    const mediaList: {
      id: string;
      url: string;
      source: string;
      title: string;
      size?: number;
      createdAt: string;
    }[] = [];

    // 1. Files in public/uploads
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        if (!f.startsWith(".")) {
          const stats = fs.statSync(path.join(uploadsDir, f));
          mediaList.push({
            id: `local-${f}`,
            url: `/uploads/${f}`,
            source: "Direct Uploads",
            title: f,
            size: stats.size,
            createdAt: stats.birthtime.toISOString(),
          });
        }
      }
    }

    // 2. Images from properties
    const properties = getAllProperties();
    for (const p of properties) {
      for (const img of p.images || []) {
        if (img.url && !mediaList.some((m) => m.url === img.url)) {
          mediaList.push({
            id: img.id || `prop-${Math.random().toString(36).substring(2, 7)}`,
            url: img.url,
            source: `Property: ${p.name}`,
            title: img.caption || p.name,
            createdAt: p.createdAt,
          });
        }
      }
    }

    // 3. Images from blogs
    const blogs = getAllBlogs();
    for (const b of blogs) {
      if (b.featuredImage && !mediaList.some((m) => m.url === b.featuredImage)) {
        mediaList.push({
          id: `blog-${b.id}`,
          url: b.featuredImage,
          source: `Blog: ${b.title}`,
          title: b.title,
          createdAt: b.createdAt,
        });
      }
    }

    // 4. Images from events
    const events = getAllEvents();
    for (const e of events) {
      if (e.coverImage && !mediaList.some((m) => m.url === e.coverImage)) {
        mediaList.push({
          id: `event-${e.id}`,
          url: e.coverImage,
          source: `Event: ${e.title}`,
          title: e.title,
          createdAt: e.createdAt,
        });
      }
    }

    // 5. Images from deals
    const deals = getAllDeals();
    for (const d of deals) {
      if (d.promoImage && !mediaList.some((m) => m.url === d.promoImage)) {
        mediaList.push({
          id: `deal-${d.id}`,
          url: d.promoImage,
          source: `Deal: ${d.title}`,
          title: d.title,
          createdAt: d.createdAt,
        });
      }
    }

    return NextResponse.json({
      success: true,
      media: mediaList,
      total: mediaList.length,
    });
  } catch (error) {
    console.error("Admin Media GET Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch media assets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = getAuthenticatedAdmin(req);
    if (!admin || !checkAdminPermission(admin, "media.upload")) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const blob = file as File;
    if (!ALLOWED_MIME_TYPES.includes(blob.type)) {
      return NextResponse.json({ success: false, message: "Unsupported file type. Use JPG, PNG, WEBP, or AVIF" }, { status: 400 });
    }

    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, message: "File exceeds 10MB limit" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(blob.name) || `.${blob.type.split("/")[1] || "jpg"}`;
    const uniqueFilename = `media_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;

    recordAuditLog({
      adminId: admin.id,
      adminName: admin.fullName,
      adminEmail: admin.email,
      module: "media_library",
      action: "upload_media",
      resourceId: uniqueFilename,
      resourceType: "media",
      details: `Uploaded media asset ${uniqueFilename} (${blob.size} bytes)`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: uniqueFilename,
    });
  } catch (error) {
    console.error("Admin Media POST Error:", error);
    return NextResponse.json({ success: false, message: "Failed to upload media" }, { status: 500 });
  }
}
