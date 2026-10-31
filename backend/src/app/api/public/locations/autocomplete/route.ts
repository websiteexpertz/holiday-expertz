import { NextRequest, NextResponse } from "next/server";
import { getSmartLocationAutocomplete } from "../../../../../lib/services/locationAutocompleteService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const level = (searchParams.get("level") as any) || undefined;
    const countryId = searchParams.get("countryId") || undefined;
    const stateId = searchParams.get("stateId") || undefined;
    const cityId = searchParams.get("cityId") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 30) : 15;

    const suggestions = getSmartLocationAutocomplete({
      query,
      limit,
      level,
      countryId,
      stateId,
      cityId,
    });

    return NextResponse.json({
      success: true,
      query,
      level: level || "auto",
      suggestions,
      total: suggestions.length,
    });
  } catch (error) {
    console.error("Location Autocomplete API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate location autocomplete suggestions", suggestions: [] },
      { status: 500 }
    );
  }
}
