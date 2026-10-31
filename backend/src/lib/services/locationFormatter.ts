/**
 * Location Formatter Utility for HolidayExpertz
 *
 * Generates canonical, deduplicated full location paths across the hierarchy:
 * Locality (Area) → City → State → Country
 *
 * Examples:
 * - India
 * - Uttarakhand, India
 * - Dehradun, Uttarakhand, India
 * - Rajpur Road, Dehradun, Uttarakhand, India
 */

export interface LocationHierarchyInput {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  locality?: string | null;
  area?: string | null; // Locality alias
}

export type LocationHierarchyType = "country" | "state" | "city" | "area" | "locality" | "property";

/**
 * Cleanly formats a full hierarchical location path, eliminating duplicate segments
 * and trimming whitespace.
 *
 * e.g. { locality: "Rajpur Road", city: "Dehradun", state: "Uttarakhand", country: "India" }
 *   => "Rajpur Road, Dehradun, Uttarakhand, India"
 *
 * e.g. { city: "Goa", state: "Goa", country: "India" }
 *   => "Goa, India" (prevents "Goa, Goa, India")
 */
export function formatFullLocationPath(input: LocationHierarchyInput): string {
  if (!input) return "";

  const locality = (input.locality || input.area || "").trim();
  const city = (input.city || "").trim();
  const state = (input.state || "").trim();
  const country = (input.country || "").trim();

  const rawSegments = [locality, city, state, country].filter(Boolean);
  const deduplicated: string[] = [];

  for (const seg of rawSegments) {
    const lower = seg.toLowerCase();
    // Do not add if already present in the list (case-insensitive deduplication)
    if (!deduplicated.some((existing) => existing.toLowerCase() === lower)) {
      deduplicated.push(seg);
    }
  }

  return deduplicated.join(", ");
}

/**
 * Returns the parent location path for display underneath the primary name:
 * - For Area/Locality: returns "City, State, Country"
 * - For City: returns "State, Country"
 * - For State: returns "Country"
 * - For Country: returns ""
 * - For Property: returns "Locality, City, State, Country" (full location context)
 */
export function formatParentLocationPath(
  type: LocationHierarchyType,
  input: LocationHierarchyInput
): string {
  if (!input) return "";

  if (type === "country") {
    return "";
  }

  if (type === "state") {
    return (input.country || "").trim();
  }

  if (type === "city") {
    return formatFullLocationPath({
      state: input.state,
      country: input.country,
    });
  }

  if (type === "area" || type === "locality") {
    return formatFullLocationPath({
      city: input.city,
      state: input.state,
      country: input.country,
    });
  }

  if (type === "property") {
    return formatFullLocationPath(input);
  }

  return "";
}

/**
 * Normalizes text for case-insensitive and punctuation-agnostic search comparisons.
 */
export function normalizeSearchString(val: string): string {
  if (!val) return "";
  return val
    .toLowerCase()
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
