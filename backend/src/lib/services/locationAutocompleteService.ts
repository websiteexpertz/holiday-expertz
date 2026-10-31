import { getAllDestinations } from "../storage/destinationStore";
import { getAllProperties } from "../storage/propertyStore";
import {
  formatFullLocationPath,
  formatParentLocationPath,
  normalizeSearchString,
} from "./locationFormatter";

export type AutocompleteLocationType = "country" | "state" | "city" | "area" | "property";

export interface AutocompleteSuggestionItem {
  id: string;
  type: AutocompleteLocationType;
  name: string;
  fullPath: string;
  parentPath: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
  countryName?: string;
  stateName?: string;
  cityName?: string;
  areaName?: string;
  propertyCount?: number;
  propertyType?: string;
  pricePerNight?: number;
  isPopular?: boolean;
  score?: number;
}

/**
 * Builds the canonical in-memory search index of destinations and properties.
 * Designed behind this service interface to allow drop-in migration to MongoDB queries.
 */
function buildLocationIndex(): AutocompleteSuggestionItem[] {
  const dest = getAllDestinations();
  const properties = getAllProperties(true).filter((p) => p.status === "approved");

  const countryMap = new Map(dest.countries.map((c) => [c.id, c]));
  const stateMap = new Map(dest.states.map((s) => [s.id, s]));
  const cityMap = new Map(dest.cities.map((c) => [c.id, c]));

  const index: AutocompleteSuggestionItem[] = [];

  // 1. Countries
  for (const c of dest.countries) {
    if (!c.isActive) continue;

    const fullPath = formatFullLocationPath({ country: c.name });
    const parentPath = formatParentLocationPath("country", { country: c.name });

    const propsCount = properties.filter(
      (p) =>
        p.location.country.toLowerCase() === c.name.toLowerCase() ||
        p.location.countryId === c.id
    ).length;

    index.push({
      id: c.id,
      type: "country",
      name: c.name,
      fullPath,
      parentPath,
      countryId: c.id,
      countryName: c.name,
      propertyCount: propsCount,
    });
  }

  // 2. States
  for (const s of dest.states) {
    if (!s.isActive) continue;
    const country = countryMap.get(s.countryId);

    const fullPath = formatFullLocationPath({
      state: s.name,
      country: country?.name,
    });
    const parentPath = formatParentLocationPath("state", {
      state: s.name,
      country: country?.name,
    });

    const propsCount = properties.filter((p) => {
      const matchState = p.location.state.toLowerCase() === s.name.toLowerCase() || p.location.stateId === s.id;
      const matchCountry = country ? p.location.country.toLowerCase() === country.name.toLowerCase() : true;
      return matchState && matchCountry;
    }).length;

    index.push({
      id: s.id,
      type: "state",
      name: s.name,
      fullPath,
      parentPath,
      countryId: s.countryId,
      stateId: s.id,
      countryName: country?.name,
      stateName: s.name,
      propertyCount: propsCount,
    });
  }

  // 3. Cities
  for (const ct of dest.cities) {
    if (!ct.isActive) continue;
    const state = stateMap.get(ct.stateId);
    const country = countryMap.get(ct.countryId) || (state ? countryMap.get(state.countryId) : undefined);

    const fullPath = formatFullLocationPath({
      city: ct.name,
      state: state?.name,
      country: country?.name,
    });
    const parentPath = formatParentLocationPath("city", {
      city: ct.name,
      state: state?.name,
      country: country?.name,
    });

    const propsCount = properties.filter((p) => {
      const matchCity = p.location.city.toLowerCase() === ct.name.toLowerCase() || p.location.cityId === ct.id;
      const matchState = state ? p.location.state.toLowerCase() === state.name.toLowerCase() : true;
      return matchCity && matchState;
    }).length;

    index.push({
      id: ct.id,
      type: "city",
      name: ct.name,
      fullPath,
      parentPath,
      countryId: country?.id || ct.countryId,
      stateId: ct.stateId,
      cityId: ct.id,
      countryName: country?.name,
      stateName: state?.name,
      cityName: ct.name,
      propertyCount: propsCount,
      isPopular: ct.isPopular,
    });
  }

  // 4. Areas / Localities
  for (const ar of dest.areas) {
    if (!ar.isActive) continue;
    const city = cityMap.get(ar.cityId);
    const state = stateMap.get(ar.stateId) || (city ? stateMap.get(city.stateId) : undefined);
    const country = countryMap.get(ar.countryId) || (state ? countryMap.get(state.countryId) : undefined);

    const fullPath = formatFullLocationPath({
      locality: ar.name,
      city: city?.name,
      state: state?.name,
      country: country?.name,
    });
    const parentPath = formatParentLocationPath("area", {
      locality: ar.name,
      city: city?.name,
      state: state?.name,
      country: country?.name,
    });

    const propsCount = properties.filter((p) => {
      const matchArea =
        p.location.areaId === ar.id ||
        (p.location.locality && p.location.locality.toLowerCase().includes(ar.name.toLowerCase())) ||
        ar.name.toLowerCase().includes((p.location.locality || "").toLowerCase());
      const matchCity = city ? p.location.city.toLowerCase() === city.name.toLowerCase() : true;
      return matchArea && matchCity;
    }).length;

    index.push({
      id: ar.id,
      type: "area",
      name: ar.name,
      fullPath,
      parentPath,
      countryId: country?.id || ar.countryId,
      stateId: state?.id || ar.stateId,
      cityId: ar.cityId,
      areaId: ar.id,
      countryName: country?.name,
      stateName: state?.name,
      cityName: city?.name,
      areaName: ar.name,
      propertyCount: propsCount,
    });
  }

  // 5. Properties (Searchable by property name, with distinct badge and complete location path)
  for (const p of properties) {
    const fullPath = formatFullLocationPath({
      locality: p.location.locality,
      city: p.location.city,
      state: p.location.state,
      country: p.location.country,
    });

    index.push({
      id: p.id,
      type: "property",
      name: p.name,
      fullPath,
      parentPath: fullPath,
      countryId: p.location.countryId,
      stateId: p.location.stateId,
      cityId: p.location.cityId,
      areaId: p.location.areaId,
      countryName: p.location.country,
      stateName: p.location.state,
      cityName: p.location.city,
      areaName: p.location.locality,
      propertyType: p.propertyType,
      pricePerNight: p.pricing.pricePerNight,
    });
  }

  // Include showcase mock stays if not already present in properties
  const SHOWCASE_PROPERTIES = [
    {
      id: "h-1",
      name: "The Oberoi Udaivilas Palace",
      locality: "Lake Pichola Outer Area",
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      countryId: "cnt_in",
      stateId: "st_raj",
      cityId: "ct_udaipur",
      areaId: "ar_pichola",
      propertyType: "Luxury Hotels",
      pricePerNight: 38500,
    },
    {
      id: "h-2",
      name: "Taj Exotica Resort & Spa",
      locality: "Benaulim",
      city: "Goa",
      state: "Goa",
      country: "India",
      countryId: "cnt_in",
      stateId: "st_goa",
      propertyType: "Resorts",
      pricePerNight: 22000,
    },
    {
      id: "h-3",
      name: "Wildflower Hall, An Oberoi Resort",
      locality: "Mashobra",
      city: "Shimla",
      state: "Himachal Pradesh",
      country: "India",
      countryId: "cnt_in",
      stateId: "st_hp",
      propertyType: "Resorts",
      pricePerNight: 29000,
    },
    {
      id: "h-6",
      name: "Ananda in the Himalayas",
      locality: "Narendra Nagar",
      city: "Rishikesh",
      state: "Uttarakhand",
      country: "India",
      countryId: "cnt_in",
      stateId: "st_uk",
      propertyType: "Boutique Stays",
      pricePerNight: 42000,
    },
    {
      id: "h-7",
      name: "The Amber Haven Heritage Haveli",
      locality: "Old City",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      countryId: "cnt_in",
      stateId: "st_raj",
      cityId: "ct_jaipur",
      propertyType: "Budget Hotels",
      pricePerNight: 6500,
    },
  ];

  for (const sp of SHOWCASE_PROPERTIES) {
    if (!index.some((item) => item.id === sp.id || item.name.toLowerCase() === sp.name.toLowerCase())) {
      const fullPath = formatFullLocationPath({
        locality: sp.locality,
        city: sp.city,
        state: sp.state,
        country: sp.country,
      });

      index.push({
        id: sp.id,
        type: "property",
        name: sp.name,
        fullPath,
        parentPath: fullPath,
        countryId: sp.countryId,
        stateId: sp.stateId,
        cityId: sp.cityId,
        areaId: sp.areaId,
        countryName: sp.country,
        stateName: sp.state,
        cityName: sp.city,
        areaName: sp.locality,
        propertyType: sp.propertyType,
        pricePerNight: sp.pricePerNight,
      });
    }
  }

  return index;
}

/**
 * Calculates a structured relevance score for a suggestion against a query.
 */
function scoreSuggestion(
  item: AutocompleteSuggestionItem,
  queryNorm: string,
  tokens: string[]
): number {
  const nameNorm = normalizeSearchString(item.name);
  const fullPathNorm = normalizeSearchString(item.fullPath);

  let score = 0;

  // 1. Exact entity name match (Highest priority)
  // e.g. "India" -> Country "India"
  // "Uttarakhand" -> State "Uttarakhand, India"
  // "Dehradun" -> City "Dehradun, Uttarakhand, India"
  // "Rajpur Road" -> Locality "Rajpur Road, Dehradun, Uttarakhand, India"
  if (nameNorm === queryNorm) {
    score += 1000;
  }
  // 2. Entity name starts with query
  // e.g. "Deh" -> "Dehradun"
  // "Uttar" -> "Uttarakhand, India", "Uttar Pradesh, India"
  else if (nameNorm.startsWith(queryNorm)) {
    score += 800;
  }
  // 3. Entity name contains query
  else if (nameNorm.includes(queryNorm)) {
    score += 600;
  }
  // 4. Full path starts with query
  else if (fullPathNorm.startsWith(queryNorm)) {
    score += 500;
  }
  // 5. Multi-token query across full path (e.g. "Dehradun Uttarakhand")
  else if (tokens.length > 1 && tokens.every((t) => fullPathNorm.includes(t))) {
    score += 350;
  }
  // 6. Multi-word phrase within full path
  else if (tokens.length > 1 && fullPathNorm.includes(queryNorm)) {
    score += 200;
  } else {
    return 0; // Not a match for this query
  }

  // Bonus for properties with active listings
  if (item.propertyCount && item.propertyCount > 0) {
    score += Math.min(item.propertyCount * 5, 40);
  }

  // Bonus for popular destination markers
  if (item.isPopular) {
    score += 20;
  }

  // Type-specific alignment when the entity name itself matches the query
  if (nameNorm.startsWith(queryNorm)) {
    if (item.type === "country") score += 50;
    if (item.type === "state") score += 40;
    if (item.type === "city") score += 30;
    if (item.type === "area") score += 20;
  }

  return score;
}

export interface AutocompleteFilterOptions {
  query?: string;
  limit?: number;
  level?: "country" | "state" | "city" | "area" | "auto";
  countryId?: string;
  stateId?: string;
  cityId?: string;
}

/**
 * Performs progressive, hierarchical destination autocomplete.
 * Strictly separates levels:
 * - Country level -> Only countries
 * - State level -> Only states belonging to the selected country (with full path: Uttarakhand, India)
 * - City level -> Only cities belonging to the selected state (with full path: Dehradun, Uttarakhand, India)
 * - Area/Locality level -> Only localities belonging to the selected city (with full path: Rajpur Road, Dehradun, Uttarakhand, India)
 */
export function getSmartLocationAutocomplete(
  queryOrOptions: string | AutocompleteFilterOptions,
  legacyLimit = 15
): AutocompleteSuggestionItem[] {
  const options: AutocompleteFilterOptions =
    typeof queryOrOptions === "string"
      ? { query: queryOrOptions, limit: legacyLimit }
      : queryOrOptions;

  const rawQuery = options.query || "";
  const limit = options.limit || 15;
  const level = options.level;
  const countryId = options.countryId;
  const stateId = options.stateId;
  const cityId = options.cityId;

  const allItems = buildLocationIndex();
  const trimmed = rawQuery.trim();
  const queryNorm = normalizeSearchString(trimmed);

  // ── PROGRESSIVE HIERARCHICAL MODE ──
  if (level && level !== "auto") {
    let levelItems: AutocompleteSuggestionItem[] = [];

    if (level === "country") {
      // Step 1: Countries only
      levelItems = allItems.filter((i) => i.type === "country");
    } else if (level === "state") {
      // Step 2: States only, belonging to selected country
      levelItems = allItems.filter(
        (i) => i.type === "state" && (!countryId || i.countryId === countryId)
      );
    } else if (level === "city") {
      // Step 3: Cities only, belonging to selected state (and country)
      levelItems = allItems.filter(
        (i) =>
          i.type === "city" &&
          (!stateId || i.stateId === stateId) &&
          (!countryId || i.countryId === countryId)
      );
    } else if (level === "area") {
      // Step 4: Areas / Localities only, belonging to selected city
      levelItems = allItems.filter(
        (i) => i.type === "area" && (!cityId || i.cityId === cityId)
      );
    }

    // Filter by query if user has typed something
    if (trimmed) {
      const tokens = queryNorm.split(" ").filter((t) => t.length > 0);
      const scored: AutocompleteSuggestionItem[] = [];

      for (const item of levelItems) {
        const itemNorm = normalizeSearchString(item.name);
        const pathNorm = normalizeSearchString(item.fullPath);

        let matches = false;
        let score = 0;

        if (itemNorm === queryNorm) {
          matches = true;
          score = 1000;
        } else if (itemNorm.startsWith(queryNorm)) {
          matches = true;
          score = 700;
        } else if (itemNorm.includes(queryNorm)) {
          matches = true;
          score = 500;
        } else if (pathNorm.includes(queryNorm)) {
          matches = true;
          score = 400;
        } else if (tokens.length > 0 && tokens.every((t) => itemNorm.includes(t) || pathNorm.includes(t))) {
          matches = true;
          score = 300;
        }

        if (matches) {
          scored.push({
            ...item,
            score: score + (item.propertyCount || 0),
          });
        }
      }

      scored.sort((a, b) => (b.score || 0) - (a.score || 0));
      return scored.slice(0, Math.max(1, limit));
    }

    // When query is empty, sort by propertyCount descending
    levelItems.sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));
    return levelItems.slice(0, Math.max(1, limit));
  }

  // ── GENERAL SEARCH MODE (Fallback when no level is specified) ──
  if (!trimmed) {
    const popularPicks = allItems.filter(
      (i) =>
        i.type !== "property" &&
        ((i.isPopular && i.type === "city") ||
          i.type === "area" ||
          (i.propertyCount && i.propertyCount > 0))
    );

    const seen = new Set<string>();
    const defaultSuggestions: AutocompleteSuggestionItem[] = [];

    for (const item of popularPicks) {
      if (!seen.has(item.fullPath)) {
        seen.add(item.fullPath);
        defaultSuggestions.push(item);
        if (defaultSuggestions.length >= limit) break;
      }
    }

    return defaultSuggestions;
  }

  const tokens = queryNorm.split(" ").filter((t) => t.length > 0);
  const scored: AutocompleteSuggestionItem[] = [];
  const seenPaths = new Set<string>();

  for (const item of allItems) {
    const score = scoreSuggestion(item, queryNorm, tokens);
    if (score > 0) {
      const uniqueKey = `${item.type}:${item.id}:${item.fullPath}`;
      if (!seenPaths.has(uniqueKey)) {
        seenPaths.add(uniqueKey);
        scored.push({
          ...item,
          score,
        });
      }
    }
  }

  scored.sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }
    return (b.propertyCount || 0) - (a.propertyCount || 0);
  });

  return scored.slice(0, Math.max(1, limit));
}
