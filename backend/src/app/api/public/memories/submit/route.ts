import { NextRequest, NextResponse } from "next/server";
import { createMemory } from "../../../../../lib/storage/memoryStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      guestName,
      guestEmail,
      title,
      shortDescription,
      story,
      destinationName,
      travelDate,
      images,
      coverImage,
      countryId,
      stateId,
      cityId,
      propertyName,
    } = body;

    // Strict validation for guest submissions
    if (!guestName || typeof guestName !== "string" || guestName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Your name is required." },
        { status: 400 }
      );
    }

    if (!guestEmail || typeof guestEmail !== "string" || !guestEmail.includes("@")) {
      return NextResponse.json(
        { success: false, message: "A valid email address is required so our team can verify your submission." },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "A title for your travel story is required." },
        { status: 400 }
      );
    }

    if (!destinationName || typeof destinationName !== "string" || !destinationName.trim()) {
      return NextResponse.json(
        { success: false, message: "Destination name is required." },
        { status: 400 }
      );
    }

    if (!story || typeof story !== "string" || story.trim().length < 20) {
      return NextResponse.json(
        { success: false, message: "Please share a few sentences (at least 20 characters) about your stay experience." },
        { status: 400 }
      );
    }

    const imageList = Array.isArray(images) && images.length > 0 ? images : [];
    if (imageList.length === 0 && !coverImage) {
      return NextResponse.json(
        { success: false, message: "Please provide at least one photograph from your travel experience." },
        { status: 400 }
      );
    }

    // Guest submissions are saved with pending status and NOT published immediately
    const memory = createMemory({
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      title: title.trim(),
      shortDescription: (shortDescription && typeof shortDescription === "string" ? shortDescription.trim() : story.slice(0, 140) + "..."),
      story: story.trim(),
      destinationName: destinationName.trim(),
      travelDate: travelDate?.trim(),
      countryId,
      stateId,
      cityId,
      propertyName: propertyName?.trim(),
      images: imageList,
      coverImage,
      source: "guest_submitted",
      status: "pending",
      isPublished: false,
      isActive: true,
      isDemo: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for sharing your memory! Our curation team will review and publish your story shortly.",
        id: memory.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Guest Memory Submission Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred while saving your travel memory." },
      { status: 500 }
    );
  }
}

