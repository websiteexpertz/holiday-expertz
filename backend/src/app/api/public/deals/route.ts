import { NextResponse } from "next/server";
import { getAllDealsAsync } from "../../../../lib/storage/dealStore";

export async function GET() {
  try {
    const deals = (await getAllDealsAsync()).filter((deal) => deal.status === "active");
    return NextResponse.json({ success: true, deals });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Error fetching deals" }, { status: 500 });
  }
}
