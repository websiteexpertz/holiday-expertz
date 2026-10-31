import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, message: "No image file provided." },
        { status: 400 }
      );
    }

    const blob = file as File;

    if (!ALLOWED_MIME_TYPES.includes(blob.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Unsupported file type. Please upload a JPG, PNG, WEBP, or AVIF image.",
        },
        { status: 400 }
      );
    }

    if (blob.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "File exceeds the maximum upload limit of 10MB.",
        },
        { status: 400 }
      );
    }

    // Determine target upload directory (frontend/public/uploads)
    const rootDir = process.cwd().endsWith("frontend")
      ? path.resolve(process.cwd(), "..")
      : process.cwd();
    const uploadsDir = path.join(rootDir, "frontend", "public", "uploads");

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate safe unique filename
    const ext = path.extname(blob.name) || `.${blob.type.split("/")[1] || "jpg"}`;
    const uniqueFilename = `prop_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    const buffer = Buffer.from(await blob.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully!",
      url: publicUrl,
      originalName: blob.name,
      size: blob.size,
    });
  } catch (error) {
    console.error("API Error in /api/upload:", error);
    return NextResponse.json(
      { success: false, message: "Internal error processing file upload." },
      { status: 500 }
    );
  }
}
