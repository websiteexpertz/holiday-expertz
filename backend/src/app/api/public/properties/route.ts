import { NextRequest, NextResponse } from "next/server";
import { getPublicApprovedProperties } from "../../../../lib/storage/propertyStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("search") || searchParams.get("destination") || "").toLowerCase().trim();
    const city = (searchParams.get("city") || "").toLowerCase().trim();
    const state = (searchParams.get("state") || "").toLowerCase().trim();
    const country = (searchParams.get("country") || "").toLowerCase().trim();
    const propertyType = (searchParams.get("propertyType") || searchParams.get("type") || "all").toLowerCase().trim();
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || 0);
    const guests = Number(searchParams.get("guests") || 0);
    const sort = searchParams.get("sort") || "newest"; // newest, price_asc, price_desc, rating

    let properties = getPublicApprovedProperties();

    // 1. Text & Location Filtering
    if (query) {
      const tokens = query.split(/[\s,]+/).filter(Boolean);
      properties = properties.filter((p) => {
        const searchableStr = [
          p.name,
          p.propertyType,
          p.shortDescription,
          p.detailedDescription,
          p.location.city,
          p.location.state,
          p.location.country,
          p.location.locality,
          p.location.address,
          ...(p.amenities || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return tokens.every((token) => searchableStr.includes(token));
      });
    }

    if (city) {
      properties = properties.filter((p) => p.location.city?.toLowerCase().includes(city));
    }
    if (state) {
      properties = properties.filter((p) => p.location.state?.toLowerCase().includes(state));
    }
    if (country) {
      properties = properties.filter((p) => p.location.country?.toLowerCase().includes(country));
    }

    // 2. Property Type Filtering (Single or Multiple)
    const typesParam = searchParams.get("types") || searchParams.get("propertyTypes");
    if (typesParam) {
      const selectedTypes = typesParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (selectedTypes.length > 0) {
        properties = properties.filter((p) =>
          selectedTypes.includes(p.propertyType?.toLowerCase())
        );
      }
    } else if (propertyType && propertyType !== "all") {
      properties = properties.filter(
        (p) => p.propertyType?.toLowerCase() === propertyType
      );
    }

    // 3. Price Range Filtering (Sanitized & Validated)
    if (Number.isFinite(minPrice) && minPrice > 0) {
      properties = properties.filter((p) => (p.pricing?.pricePerNight || 0) >= minPrice);
    }
    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      properties = properties.filter((p) => (p.pricing?.pricePerNight || 0) <= maxPrice);
    }

    // 4. Amenities Filtering (Must match all selected amenities)
    const amenitiesParam = searchParams.get("amenities");
    if (amenitiesParam) {
      const selectedAmenities = amenitiesParam
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter(Boolean);
      if (selectedAmenities.length > 0) {
        properties = properties.filter((p) => {
          const propAmenities = (p.amenities || []).map((a) => a.toLowerCase());
          return selectedAmenities.every((reqAm) =>
            propAmenities.some((pa) => pa.includes(reqAm) || reqAm.includes(pa))
          );
        });
      }
    }

    // 5. Rating & Star Classification (Sanitized)
    const minRating = Number(searchParams.get("minRating") || searchParams.get("rating") || 0);
    if (Number.isFinite(minRating) && minRating > 0) {
      properties = properties.filter((p) => (p.rating || 5) >= minRating);
    }

    // 6. Capacity Filtering
    if (Number.isFinite(guests) && guests > 0) {
      properties = properties.filter((p) => (p.capacity?.maxGuests || 0) >= guests);
    }

    // 5. Sorting
    properties = [...properties].sort((a, b) => {
      if (sort === "price_asc") {
        return (a.pricing?.pricePerNight || 0) - (b.pricing?.pricePerNight || 0);
      }
      if (sort === "price_desc") {
        return (b.pricing?.pricePerNight || 0) - (a.pricing?.pricePerNight || 0);
      }
      if (sort === "rating") {
        return (b.rating || 5) - (a.rating || 5);
      }
      // Default: newest first
      const dateA = new Date(a.approvedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.approvedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error) {
    console.error("Error fetching public properties:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
