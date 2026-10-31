import { NextResponse } from "next/server";
import { getActiveDeals } from "../../../../lib/storage/dealStore";

export async function GET() {
  try {
    const deals = getActiveDeals();
    return NextResponse.json({ success: true, deals });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching deals" }, { status: 500 });
  }
}
