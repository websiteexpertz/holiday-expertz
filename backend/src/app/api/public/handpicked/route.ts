import { NextResponse } from "next/server";
import { getPublicHandpickedProperties } from "../../../../lib/storage/handpickedStore";

export async function GET() {
  try {
    const list = getPublicHandpickedProperties();
    return NextResponse.json({ success: true, handpicked: list });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching handpicked properties" }, { status: 500 });
  }
}
