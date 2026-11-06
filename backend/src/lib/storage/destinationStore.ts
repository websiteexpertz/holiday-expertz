import fs from "fs";
import path from "path";
import {
  CountryRecord,
  StateRecord,
  CityRecord,
  AreaRecord,
  DestinationHierarchyCounts,
} from "../../types/admin";
import { getAllProperties } from "./propertyStore";
import { Property } from "../../types/property";
import { connectToDatabase } from "../db/mongodb";
import { CountryModel, StateModel, CityModel, AreaModel } from "../models/Destination";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "destinations.json");

export interface DestinationsStorageFormat {
  countries: CountryRecord[];
  states: StateRecord[];
  cities: CityRecord[];
  areas: AreaRecord[];
}

let destinationsCache: DestinationsStorageFormat | null = null;

function getInitialDestinations(): DestinationsStorageFormat {
  const now = new Date().toISOString();

  const countries: CountryRecord[] = [
    {
      id: "cnt_in",
      name: "India",
      code: "IN",
      image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
      description: "Subcontinent of royal palaces, tropical beaches, Himalayan peaks, and timeless heritage.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cnt_ae",
      name: "United Arab Emirates",
      code: "AE",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
      description: "Iconic luxury skyline, desert safaris, and Arabian hospitality.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cnt_mv",
      name: "Maldives",
      code: "MV",
      image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80",
      description: "Turquoise coral lagoons and signature overwater luxury villas.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const states: StateRecord[] = [
    // India States
    {
      id: "st_raj",
      name: "Rajasthan",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "st_goa",
      name: "Goa",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "st_uk",
      name: "Uttarakhand",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "st_hp",
      name: "Himachal Pradesh",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "st_ker",
      name: "Kerala",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // UAE States
    {
      id: "st_dxb",
      name: "Dubai",
      countryId: "cnt_ae",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const cities: CityRecord[] = [
    // Rajasthan
    {
      id: "ct_udaipur",
      name: "Udaipur",
      stateId: "st_raj",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ct_jaipur",
      name: "Jaipur",
      stateId: "st_raj",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Goa
    {
      id: "ct_panaji",
      name: "Panaji",
      stateId: "st_goa",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ct_anjuna",
      name: "Anjuna",
      stateId: "st_goa",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Uttarakhand
    {
      id: "ct_dehradun",
      name: "Dehradun",
      stateId: "st_uk",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ct_mussoorie",
      name: "Mussoorie",
      stateId: "st_uk",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Himachal
    {
      id: "ct_manali",
      name: "Manali",
      stateId: "st_hp",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Kerala
    {
      id: "ct_munnar",
      name: "Munnar",
      stateId: "st_ker",
      countryId: "cnt_in",
      image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Dubai
    {
      id: "ct_marina",
      name: "Downtown Dubai",
      stateId: "st_dxb",
      countryId: "cnt_ae",
      image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
      isPopular: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const areas: AreaRecord[] = [
    // Udaipur
    {
      id: "ar_pichola",
      name: "Lake Pichola Outer Area",
      cityId: "ct_udaipur",
      stateId: "st_raj",
      countryId: "cnt_in",
      postalCode: "313001",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "ar_fatehsagar",
      name: "Fateh Sagar Promenade",
      cityId: "ct_udaipur",
      stateId: "st_raj",
      countryId: "cnt_in",
      postalCode: "313004",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Anjuna
    {
      id: "ar_anjunabeach",
      name: "Anjuna Beach Road",
      cityId: "ct_anjuna",
      stateId: "st_goa",
      countryId: "cnt_in",
      postalCode: "403509",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Dehradun
    {
      id: "ar_rajpur",
      name: "Rajpur Road",
      cityId: "ct_dehradun",
      stateId: "st_uk",
      countryId: "cnt_in",
      postalCode: "248001",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Mussoorie
    {
      id: "ar_mallroad",
      name: "The Mall Road",
      cityId: "ct_mussoorie",
      stateId: "st_uk",
      countryId: "cnt_in",
      postalCode: "248179",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // Manali
    {
      id: "ar_oldmanali",
      name: "Old Manali Village",
      cityId: "ct_manali",
      stateId: "st_hp",
      countryId: "cnt_in",
      postalCode: "175131",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return { countries, states, cities, areas };
}

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialDestinations();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function getAllDestinations(): DestinationsStorageFormat {
  if (destinationsCache !== null) {
    return destinationsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.countries) && Array.isArray(parsed.states)) {
      destinationsCache = parsed;
    } else {
      destinationsCache = getInitialDestinations();
      saveDestinations(destinationsCache);
    }
    return destinationsCache!;
  } catch (error) {
    console.error("Backend Destination Storage Error:", error);
    destinationsCache = getInitialDestinations();
    return destinationsCache!;
  }
}

export function saveDestinations(data: DestinationsStorageFormat): void {
  destinationsCache = data;

  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
  } catch (error) {
    console.warn("Destination JSON persistence unavailable; using MongoDB:", error);
  }

  connectToDatabase()
    .then(async () => {
      for (const c of data.countries) {
        await CountryModel.findOneAndUpdate({ id: c.id }, c, { upsert: true });
      }
      for (const s of data.states) {
        await StateModel.findOneAndUpdate({ id: s.id }, s, { upsert: true });
      }
      for (const ci of data.cities) {
        await CityModel.findOneAndUpdate({ id: ci.id }, ci, { upsert: true });
      }
      for (const a of data.areas) {
        await AreaModel.findOneAndUpdate({ id: a.id }, a, { upsert: true });
      }
    })
    .catch((error) => {
      console.error("MongoDB destination persistence failed:", error);
    });
}

// ── Hierarchy Live Counts & Linking ──

export function getDestinationMetrics(): DestinationHierarchyCounts {
  const dest = getAllDestinations();
  const properties = getAllProperties();

  return {
    countriesCount: dest.countries.length,
    statesCount: dest.states.length,
    citiesCount: dest.cities.length,
    areasCount: dest.areas.length,
    propertiesCount: properties.length,
  };
}

export function getCountriesWithCounts(): (CountryRecord & {
  statesCount: number;
  citiesCount: number;
  areasCount: number;
  propertiesCount: number;
  publishedCount: number;
  pendingCount: number;
})[] {
  const dest = getAllDestinations();
  const properties = getAllProperties();

  return dest.countries.map((country) => {
    const countryStates = dest.states.filter((s) => s.countryId === country.id);
    const stateIds = new Set(countryStates.map((s) => s.id));
    const countryCities = dest.cities.filter((c) => stateIds.has(c.stateId) || c.countryId === country.id);
    const cityIds = new Set(countryCities.map((c) => c.id));
    const countryAreas = dest.areas.filter((a) => cityIds.has(a.cityId) || a.countryId === country.id);

    // Match properties by country name or id
    const countryProps = properties.filter(
      (p) =>
        p.location.country.toLowerCase() === country.name.toLowerCase() ||
        p.location.country.toLowerCase() === country.code.toLowerCase()
    );

    return {
      ...country,
      statesCount: countryStates.length,
      citiesCount: countryCities.length,
      areasCount: countryAreas.length,
      propertiesCount: countryProps.length,
      publishedCount: countryProps.filter((p) => p.status === "approved").length,
      pendingCount: countryProps.filter((p) => p.status === "pending_approval").length,
    };
  });
}

export function getStatesByCountry(countryId: string): (StateRecord & {
  citiesCount: number;
  areasCount: number;
  propertiesCount: number;
})[] {
  const dest = getAllDestinations();
  const properties = getAllProperties();
  const country = dest.countries.find((c) => c.id === countryId);

  const states = dest.states.filter((s) => s.countryId === countryId);

  return states.map((state) => {
    const stateCities = dest.cities.filter((c) => c.stateId === state.id);
    const cityIds = new Set(stateCities.map((c) => c.id));
    const stateAreas = dest.areas.filter((a) => cityIds.has(a.cityId) || a.stateId === state.id);

    const stateProps = properties.filter((p) => {
      const matchState = p.location.state.toLowerCase() === state.name.toLowerCase();
      const matchCountry = country ? p.location.country.toLowerCase() === country.name.toLowerCase() : true;
      return matchState && matchCountry;
    });

    return {
      ...state,
      citiesCount: stateCities.length,
      areasCount: stateAreas.length,
      propertiesCount: stateProps.length,
    };
  });
}

export function getCitiesByState(stateId: string): (CityRecord & {
  areasCount: number;
  propertiesCount: number;
})[] {
  const dest = getAllDestinations();
  const properties = getAllProperties();
  const state = dest.states.find((s) => s.id === stateId);

  const cities = dest.cities.filter((c) => c.stateId === stateId);

  return cities.map((city) => {
    const cityAreas = dest.areas.filter((a) => a.cityId === city.id);
    const cityProps = properties.filter((p) => {
      const matchCity = p.location.city.toLowerCase() === city.name.toLowerCase();
      const matchState = state ? p.location.state.toLowerCase() === state.name.toLowerCase() : true;
      return matchCity && matchState;
    });

    return {
      ...city,
      areasCount: cityAreas.length,
      propertiesCount: cityProps.length,
    };
  });
}

export function getAreasByCity(cityId: string): (AreaRecord & {
  propertiesCount: number;
})[] {
  const dest = getAllDestinations();
  const properties = getAllProperties();
  const city = dest.cities.find((c) => c.id === cityId);

  const areas = dest.areas.filter((a) => a.cityId === cityId);

  return areas.map((area) => {
    const areaProps = properties.filter((p) => {
      const matchCity = city ? p.location.city.toLowerCase() === city.name.toLowerCase() : true;
      const matchArea =
        p.location.locality?.toLowerCase().includes(area.name.toLowerCase()) ||
        area.name.toLowerCase().includes(p.location.locality?.toLowerCase() || "");
      return matchCity && matchArea;
    });

    return {
      ...area,
      propertiesCount: areaProps.length,
    };
  });
}

export function getPropertiesAtLocation(options: {
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
}): Property[] {
  const dest = getAllDestinations();
  const allProps = getAllProperties();

  const country = options.countryId ? dest.countries.find((c) => c.id === options.countryId) : null;
  const state = options.stateId ? dest.states.find((s) => s.id === options.stateId) : null;
  const city = options.cityId ? dest.cities.find((c) => c.id === options.cityId) : null;
  const area = options.areaId ? dest.areas.find((a) => a.id === options.areaId) : null;

  return allProps.filter((p) => {
    if (options.countryId) {
      const matchId = p.countryId === options.countryId || p.location.countryId === options.countryId;
      const matchName = country && (
        p.location.country.toLowerCase() === country.name.toLowerCase() ||
        p.location.country.toLowerCase() === country.code.toLowerCase()
      );
      if (!matchId && !matchName) return false;
    }
    if (options.stateId) {
      const matchId = p.stateId === options.stateId || p.location.stateId === options.stateId;
      const matchName = state && p.location.state.toLowerCase() === state.name.toLowerCase();
      if (!matchId && !matchName) return false;
    }
    if (options.cityId) {
      const matchId = p.cityId === options.cityId || p.location.cityId === options.cityId;
      const matchName = city && p.location.city.toLowerCase() === city.name.toLowerCase();
      if (!matchId && !matchName) return false;
    }
    if (options.areaId) {
      const matchId = p.areaId === options.areaId || p.location.areaId === options.areaId;
      const matchArea = area && (
        p.location.locality?.toLowerCase().includes(area.name.toLowerCase()) ||
        area.name.toLowerCase().includes(p.location.locality?.toLowerCase() || "")
      );
      if (!matchId && !matchArea) return false;
    }
    return true;
  });
}

// ── CRUD Operations with Dependency Protection ──

export function createCountry(name: string, code?: string, description?: string, image?: string): CountryRecord {
  const dest = getAllDestinations();
  const normalizedName = name.trim();
  const exists = dest.countries.some((c) => c.name.toLowerCase() === normalizedName.toLowerCase());
  if (exists) {
    throw new Error(`Country "${normalizedName}" already exists.`);
  }

  const countryCode = (code?.trim().toUpperCase()) || normalizedName.slice(0, 3).toUpperCase();
  const id = `cnt_${countryCode.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const newCountry: CountryRecord = {
    id,
    name: normalizedName,
    code: countryCode,
    description: description?.trim(),
    image: image?.trim() || "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  dest.countries.push(newCountry);
  saveDestinations(dest);
  return newCountry;
}

export function createState(name: string, countryId: string, image?: string): StateRecord {
  const dest = getAllDestinations();
  const country = dest.countries.find((c) => c.id === countryId);
  if (!country) throw new Error("Parent country not found.");

  const normalizedName = name.trim();
  const exists = dest.states.some(
    (s) => s.countryId === countryId && s.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (exists) throw new Error(`State "${normalizedName}" already exists in ${country.name}.`);

  const id = `st_${normalizedName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 10)}_${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const newState: StateRecord = {
    id,
    name: normalizedName,
    countryId,
    image: image?.trim(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  dest.states.push(newState);
  saveDestinations(dest);
  return newState;
}

export function createCity(name: string, stateId: string, countryId: string, image?: string): CityRecord {
  const dest = getAllDestinations();
  const state = dest.states.find((s) => s.id === stateId);
  if (!state) throw new Error("Parent state not found.");

  const normalizedName = name.trim();
  const exists = dest.cities.some(
    (c) => c.stateId === stateId && c.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (exists) throw new Error(`City "${normalizedName}" already exists in ${state.name}.`);

  const id = `ct_${normalizedName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 10)}_${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const newCity: CityRecord = {
    id,
    name: normalizedName,
    stateId,
    countryId: countryId || state.countryId,
    image: image?.trim(),
    isPopular: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  dest.cities.push(newCity);
  saveDestinations(dest);
  return newCity;
}

export function createArea(name: string, cityId: string, postalCode?: string): AreaRecord {
  const dest = getAllDestinations();
  const city = dest.cities.find((c) => c.id === cityId);
  if (!city) throw new Error("Parent city not found.");

  const normalizedName = name.trim();
  const exists = dest.areas.some(
    (a) => a.cityId === cityId && a.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (exists) throw new Error(`Area "${normalizedName}" already exists in ${city.name}.`);

  const id = `ar_${normalizedName.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 10)}_${Date.now().toString().slice(-4)}`;
  const now = new Date().toISOString();
  const newArea: AreaRecord = {
    id,
    name: normalizedName,
    cityId,
    stateId: city.stateId,
    countryId: city.countryId,
    postalCode: postalCode?.trim(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  dest.areas.push(newArea);
  saveDestinations(dest);
  return newArea;
}

export function deleteCountrySafe(countryId: string): void {
  const dest = getAllDestinations();
  const hasStates = dest.states.some((s) => s.countryId === countryId);
  if (hasStates) {
    throw new Error("Cannot delete country with registered states. Delete or reassign states first.");
  }
  const countryProps = getPropertiesAtLocation({ countryId });
  if (countryProps.length > 0) {
    throw new Error("Cannot delete country with registered properties. Delete or reassign properties first.");
  }
  dest.countries = dest.countries.filter((c) => c.id !== countryId);
  saveDestinations(dest);
  connectToDatabase().then(() => CountryModel.deleteOne({ id: countryId })).catch(() => {});
}

export function deleteStateSafe(stateId: string): void {
  const dest = getAllDestinations();
  const hasCities = dest.cities.some((c) => c.stateId === stateId);
  if (hasCities) {
    throw new Error("Cannot delete state with registered cities. Delete or reassign cities first.");
  }
  const stateProps = getPropertiesAtLocation({ stateId });
  if (stateProps.length > 0) {
    throw new Error("Cannot delete state with registered properties. Delete or reassign properties first.");
  }
  dest.states = dest.states.filter((s) => s.id !== stateId);
  saveDestinations(dest);
  connectToDatabase().then(() => StateModel.deleteOne({ id: stateId })).catch(() => {});
}

export function deleteCitySafe(cityId: string): void {
  const dest = getAllDestinations();
  const hasAreas = dest.areas.some((a) => a.cityId === cityId);
  if (hasAreas) {
    throw new Error("Cannot delete city with registered areas. Delete or reassign areas first.");
  }
  const cityProps = getPropertiesAtLocation({ cityId });
  if (cityProps.length > 0) {
    throw new Error("Cannot delete city with registered properties. Delete or reassign properties first.");
  }
  dest.cities = dest.cities.filter((c) => c.id !== cityId);
  saveDestinations(dest);
  connectToDatabase().then(() => CityModel.deleteOne({ id: cityId })).catch(() => {});
}

export function deleteAreaSafe(areaId: string): void {
  const dest = getAllDestinations();
  const area = dest.areas.find((a) => a.id === areaId);
  if (!area) return;

  const props = getPropertiesAtLocation({ areaId });
  if (props.length > 0) {
    throw new Error("Cannot delete locality with registered properties. Delete or reassign properties first.");
  }
  dest.areas = dest.areas.filter((a) => a.id !== areaId);
  saveDestinations(dest);
  connectToDatabase().then(() => AreaModel.deleteOne({ id: areaId })).catch(() => {});
}

// ─── Aliases & helpers for admin route handlers ────────────────────────────

export function getCountryById(id: string): CountryRecord | null {
  const dest = getAllDestinations();
  return dest.countries.find((c) => c.id === id) || null;
}

export function getStateById(id: string): StateRecord | null {
  const dest = getAllDestinations();
  return dest.states.find((s) => s.id === id) || null;
}

export function getCityById(id: string): CityRecord | null {
  const dest = getAllDestinations();
  return dest.cities.find((c) => c.id === id) || null;
}

export function getAreaById(id: string): AreaRecord | null {
  const dest = getAllDestinations();
  return dest.areas.find((a) => a.id === id) || null;
}

export interface HierarchyValidationResult {
  isValid: boolean;
  error?: string;
  country?: CountryRecord;
  state?: StateRecord;
  city?: CityRecord;
  area?: AreaRecord;
}

/**
 * Validates that Country -> State -> City -> (optional Area) strictly matches canonical hierarchy
 */
export function validateHierarchy(
  countryId: string,
  stateId: string,
  cityId: string,
  areaId?: string
): HierarchyValidationResult {
  if (!countryId) {
    return { isValid: false, error: "Country selection is mandatory." };
  }
  const country = getCountryById(countryId);
  if (!country) {
    return { isValid: false, error: `Country with ID "${countryId}" does not exist in destinations database.` };
  }

  if (!stateId) {
    return { isValid: false, error: "State selection is mandatory." };
  }
  const state = getStateById(stateId);
  if (!state) {
    return { isValid: false, error: `State with ID "${stateId}" does not exist in destinations database.` };
  }
  if (state.countryId !== country.id) {
    return {
      isValid: false,
      error: `State "${state.name}" belongs to country ID "${state.countryId}", not to "${country.name}" (${country.id}). Hierarchy mismatch.`,
    };
  }

  if (!cityId) {
    return { isValid: false, error: "City selection is mandatory." };
  }
  const city = getCityById(cityId);
  if (!city) {
    return { isValid: false, error: `City with ID "${cityId}" does not exist in destinations database.` };
  }
  if (city.stateId !== state.id) {
    return {
      isValid: false,
      error: `City "${city.name}" belongs to state ID "${city.stateId}", not to "${state.name}" (${state.id}). Hierarchy mismatch.`,
    };
  }

  let area: AreaRecord | undefined;
  if (areaId) {
    const foundArea = getAreaById(areaId);
    if (!foundArea) {
      return { isValid: false, error: `Area with ID "${areaId}" does not exist.` };
    }
    if (foundArea.cityId !== city.id) {
      return {
        isValid: false,
        error: `Area "${foundArea.name}" belongs to city ID "${foundArea.cityId}", not to "${city.name}" (${city.id}). Hierarchy mismatch.`,
      };
    }
    area = foundArea;
  }

  return {
    isValid: true,
    country,
    state,
    city,
    area,
  };
}

export function getAllCountries(): (CountryRecord & {
  statesCount: number;
  citiesCount: number;
  areasCount: number;
  propertiesCount: number;
})[] {
  return getCountriesWithCounts();
}

export function getAllStates(): (StateRecord & {
  citiesCount: number;
  areasCount: number;
  propertiesCount: number;
})[] {
  const dest = getAllDestinations();
  const properties = getAllProperties();

  return dest.states.map((state) => {
    const stateCities = dest.cities.filter((c) => c.stateId === state.id);
    const cityIds = new Set(stateCities.map((c) => c.id));
    const stateAreas = dest.areas.filter((a) => cityIds.has(a.cityId) || a.stateId === state.id);

    const stateProps = properties.filter((p) => {
      return (
        p.stateId === state.id ||
        p.location.stateId === state.id ||
        p.location.state.toLowerCase() === state.name.toLowerCase()
      );
    });

    return {
      ...state,
      citiesCount: stateCities.length,
      areasCount: stateAreas.length,
      propertiesCount: stateProps.length,
    };
  });
}

export function getAllCities(): (CityRecord & {
  areasCount: number;
  propertiesCount: number;
})[] {
  const dest = getAllDestinations();
  const properties = getAllProperties();

  return dest.cities.map((city) => {
    const cityAreas = dest.areas.filter((a) => a.cityId === city.id);
    const cityProps = properties.filter((p) => {
      return (
        p.cityId === city.id ||
        p.location.cityId === city.id ||
        p.location.city.toLowerCase() === city.name.toLowerCase()
      );
    });

    return {
      ...city,
      areasCount: cityAreas.length,
      propertiesCount: cityProps.length,
    };
  });
}

export function getAllAreas(): AreaRecord[] {
  return getAllDestinations().areas;
}

export function getDestinationHierarchyCounts(): DestinationHierarchyCounts {
  return getDestinationMetrics();
}

export function getFullDestinationTree() {
  const dest = getAllDestinations();
  return dest.countries.map((country) => ({
    ...country,
    states: dest.states
      .filter((s) => s.countryId === country.id)
      .map((state) => ({
        ...state,
        cities: dest.cities
          .filter((c) => c.stateId === state.id)
          .map((city) => ({
            ...city,
            areas: dest.areas.filter((a) => a.cityId === city.id),
          })),
      })),
  }));
}

export function getPropertiesByDestination(options: {
  countryId?: string;
  stateId?: string;
  cityId?: string;
  areaId?: string;
}) {
  return getPropertiesAtLocation(options);
}

export function updateCountry(
  id: string,
  updates: Partial<Omit<CountryRecord, "id" | "createdAt">>
): CountryRecord | null {
  const dest = getAllDestinations();
  const idx = dest.countries.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  if (updates.name && updates.name.trim()) {
    const norm = updates.name.trim();
    const exists = dest.countries.some((c) => c.id !== id && c.name.toLowerCase() === norm.toLowerCase());
    if (exists) throw new Error(`Country "${norm}" already exists.`);
    updates.name = norm;
  }
  dest.countries[idx] = { ...dest.countries[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDestinations(dest);
  return dest.countries[idx];
}

export function updateState(
  id: string,
  updates: Partial<Omit<StateRecord, "id" | "createdAt">>
): StateRecord | null {
  const dest = getAllDestinations();
  const idx = dest.states.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  if (updates.name && updates.name.trim()) {
    const norm = updates.name.trim();
    const countryId = dest.states[idx].countryId;
    const exists = dest.states.some((s) => s.id !== id && s.countryId === countryId && s.name.toLowerCase() === norm.toLowerCase());
    if (exists) throw new Error(`State "${norm}" already exists in this country.`);
    updates.name = norm;
  }
  dest.states[idx] = { ...dest.states[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDestinations(dest);
  return dest.states[idx];
}

export function updateCity(
  id: string,
  updates: Partial<Omit<CityRecord, "id" | "createdAt">>
): CityRecord | null {
  const dest = getAllDestinations();
  const idx = dest.cities.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  if (updates.name && updates.name.trim()) {
    const norm = updates.name.trim();
    const stateId = dest.cities[idx].stateId;
    const exists = dest.cities.some((c) => c.id !== id && c.stateId === stateId && c.name.toLowerCase() === norm.toLowerCase());
    if (exists) throw new Error(`City "${norm}" already exists in this state.`);
    updates.name = norm;
  }
  dest.cities[idx] = { ...dest.cities[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDestinations(dest);
  return dest.cities[idx];
}

export function updateArea(
  id: string,
  updates: Partial<Omit<AreaRecord, "id" | "createdAt">>
): AreaRecord | null {
  const dest = getAllDestinations();
  const idx = dest.areas.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  dest.areas[idx] = { ...dest.areas[idx], ...updates, updatedAt: new Date().toISOString() };
  saveDestinations(dest);
  return dest.areas[idx];
}

export const deleteCountry = deleteCountrySafe;
export const deleteState = deleteStateSafe;
export const deleteCity = deleteCitySafe;
export const deleteArea = deleteAreaSafe;
