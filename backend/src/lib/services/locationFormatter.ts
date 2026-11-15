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

export interface CanonicalCountry {
  name: string;
  code: string;
  id?: string;
  aliases: string[];
}

export const KNOWN_COUNTRIES: CanonicalCountry[] = [
  {
    name: "India",
    code: "IN",
    id: "cnt_in",
    aliases: ["india", "in", "ind", "cnt_in", "bharat", "hindustan"],
  },
  {
    name: "United Arab Emirates",
    code: "AE",
    id: "cnt_ae",
    aliases: ["united arab emirates", "uae", "u.a.e.", "emirates", "cnt_ae"],
  },
  {
    name: "France",
    code: "FR",
    aliases: ["france", "fr", "fra"],
  },
  {
    name: "United Kingdom",
    code: "GB",
    id: "cnt_uk",
    aliases: ["united kingdom", "uk", "u.k.", "great britain", "britain", "england", "scotland", "wales", "cnt_uk"],
  },
  {
    name: "United States",
    code: "US",
    id: "cnt_us_5136",
    aliases: ["united states", "united states of america", "usa", "u.s.a.", "us", "u.s.", "cnt_us_5136"],
  },
  {
    name: "Maldives",
    code: "MV",
    id: "cnt_mv",
    aliases: ["maldives", "mv", "mdv", "cnt_mv"],
  },
  {
    name: "Switzerland",
    code: "CH",
    aliases: ["switzerland", "swiss", "ch", "che", "suisse", "schweiz"],
  },
  {
    name: "Germany",
    code: "DE",
    aliases: ["germany", "deutschland", "de", "deu"],
  },
  {
    name: "Bahamas",
    code: "BS",
    id: "cnt_bh_2940",
    aliases: ["bahamas", "bs", "bhs", "cnt_bh_2940"],
  },
];

/**
 * Resolves a country name, code, id, or alias to its canonical country definition.
 */
export function resolveCanonicalCountry(input?: string | null): CanonicalCountry | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (!clean) return null;

  for (const c of KNOWN_COUNTRIES) {
    if (
      c.name.toLowerCase() === clean ||
      c.code.toLowerCase() === clean ||
      (c.id && c.id.toLowerCase() === clean) ||
      c.aliases.includes(clean)
    ) {
      return c;
    }
  }

  return null;
}

/**
 * Checks whether a property's country matches a given target country.
 * Supports canonical country matching, ID matching, and case-insensitive aliases.
 */
export function isPropertyInCountry(
  property: { location?: { country?: string; countryId?: string }; countryId?: string },
  targetCountryInput?: string | null
): boolean {
  if (!targetCountryInput || !targetCountryInput.trim()) return true;

  const canonicalTarget = resolveCanonicalCountry(targetCountryInput);
  const targetId = canonicalTarget?.id?.toLowerCase();
  const targetName = (canonicalTarget?.name || targetCountryInput).trim().toLowerCase();

  const propCountry = (property.location?.country || "").trim().toLowerCase();
  const propCountryId = (property.countryId || property.location?.countryId || "").trim().toLowerCase();

  // 1. Match by country ID
  if (targetId && propCountryId && propCountryId === targetId) {
    return true;
  }

  // 2. Match by canonical country definition
  const canonicalProp = resolveCanonicalCountry(propCountry);
  if (canonicalProp && canonicalTarget) {
    return canonicalProp.name.toLowerCase() === canonicalTarget.name.toLowerCase();
  }

  // 3. Match against canonical target aliases
  if (canonicalTarget) {
    if (propCountry === canonicalTarget.name.toLowerCase() || canonicalTarget.aliases.includes(propCountry)) {
      return true;
    }
  }

  // 4. Exact match fallback
  return propCountry === targetName;
}
