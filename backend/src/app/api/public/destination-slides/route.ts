import { NextRequest, NextResponse } from "next/server";
import { getDestinationHeroImages } from "../../../../lib/storage/destinationHeroImageStore";
import { getAllDestinations } from "../../../../lib/storage/destinationStore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let countryId = searchParams.get("countryId") || "";
    let stateId = searchParams.get("stateId") || "";
    const cityId = searchParams.get("cityId") || "";
    const areaId = searchParams.get("areaId") || "";
    const locationType = searchParams.get("locationType") || "";
    const locationId = searchParams.get("locationId") || "";
    const destinationQuery = (searchParams.get("destination") || searchParams.get("search") || "").trim();

    const { countries, states, cities, areas } = getAllDestinations();

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: City / Area → resolve to parent State
    // City and Area selections inherit their parent state's images.
    // ─────────────────────────────────────────────────────────────────────────
    if (locationType === "city" || (cityId && !stateId)) {
      // Resolve city: prefer explicit cityId, then locationId
      const resolvedCityId = cityId || (locationType === "city" ? locationId : "");
      const city = cities.find((c) => c.id === resolvedCityId);
      if (city) {
        stateId = city.stateId;
        countryId = city.countryId;
      } else if (!stateId && countryId) {
        // City not found in DB — fall back to country-level images
        stateId = "";
      }
    } else if (locationType === "area" || (areaId && !stateId)) {
      // Resolve area: prefer explicit areaId, then locationId
      const resolvedAreaId = areaId || (locationType === "area" ? locationId : "");
      const area = areas.find((a) => a.id === resolvedAreaId);
      if (area) {
        stateId = area.stateId;
        countryId = area.countryId;
      } else if (!stateId && countryId) {
        stateId = "";
      }
    } else if (locationType === "property") {
      // Property-level — use countryId/stateId already on the params if present,
      // otherwise fall through to country-level fallback
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Name-based resolution (when no IDs are set but a text query exists)
    // Supports direct URL nav like ?destination=Uttarakhand or ?destination=Dehradun
    // ─────────────────────────────────────────────────────────────────────────
    if (!stateId && !countryId && destinationQuery) {
      const normalized = destinationQuery.toLowerCase();

      // Try matching a city first (resolve to parent state)
      const matchingCity = cities.find(
        (c) =>
          normalized === c.name.toLowerCase() ||
          normalized.startsWith(c.name.toLowerCase() + ",")
      );
      if (matchingCity) {
        stateId = matchingCity.stateId;
        countryId = matchingCity.countryId;
      } else {
        // Try matching an area (resolve to parent state)
        const matchingArea = areas.find(
          (a) =>
            normalized === a.name.toLowerCase() ||
            normalized.startsWith(a.name.toLowerCase() + ",")
        );
        if (matchingArea) {
          stateId = matchingArea.stateId;
          countryId = matchingArea.countryId;
        } else {
          // Try matching a state
          const matchingState = states.find(
            (s) =>
              normalized === s.name.toLowerCase() ||
              normalized.startsWith(s.name.toLowerCase() + ",") ||
              normalized.includes(s.name.toLowerCase())
          );
          if (matchingState) {
            stateId = matchingState.id;
            countryId = matchingState.countryId;
          } else {
            // Try matching a country
            const matchingCountry = countries.find(
              (c) =>
                normalized === c.name.toLowerCase() ||
                normalized.includes(c.name.toLowerCase()) ||
                c.code.toLowerCase() === normalized
            );
            if (matchingCountry) {
              countryId = matchingCountry.id;
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Enforce minimum — need at least a country or state to fetch slides
    // ─────────────────────────────────────────────────────────────────────────
    if (!stateId && !countryId) {
      return NextResponse.json({
        success: true,
        destinationType: null,
        destinationName: null,
        slides: [],
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Resolve display name for hero heading
    // ─────────────────────────────────────────────────────────────────────────
    let destinationType: "country" | "state" | null = null;
    let destinationName: string | null = null;

    if (stateId) {
      const stateObj = states.find((s) => s.id.toLowerCase() === stateId.toLowerCase());
      if (stateObj) {
        destinationType = "state";
        destinationName = stateObj.name;
        countryId = stateObj.countryId;
      }
    }

    if (!destinationType && countryId) {
      const countryObj = countries.find((c) => c.id.toLowerCase() === countryId.toLowerCase());
      if (countryObj) {
        destinationType = "country";
        destinationName = countryObj.name;
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Fetch active images with state-over-country priority
    // If state has no images, getDestinationHeroImages already falls back to country images
    // ─────────────────────────────────────────────────────────────────────────
    const slides = getDestinationHeroImages({
      countryId,
      stateId,
      onlyActive: true,
    });

    return NextResponse.json({
      success: true,
      destinationType,
      destinationName,
      countryId,
      stateId,
      slides,
      total: slides.length,
    });
  } catch (err: any) {
    console.error("Public Destination Slides API Error:", err);
    return NextResponse.json(
      { success: false, message: "Error fetching destination slides", slides: [] },
      { status: 500 }
    );
  }
}
