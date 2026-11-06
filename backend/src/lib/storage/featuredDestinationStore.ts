import fs from "fs";
import path from "path";
import crypto from "crypto";
import { FeaturedDestination } from "../../types/admin";
import { getAllDestinations } from "./destinationStore";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "featuredDestinations.json");

let cache: FeaturedDestination[] | null = null;

// ─── Default seed ───────────────────────────────────────────────────────────
function getInitialData(): FeaturedDestination[] {
  const now = new Date().toISOString();
  return [
    {
      id: "fd_1",
      name: "Taj Mahal",
      countryId: "cnt_in",
      stateId: "st_uk",
      imageUrl:
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2400&q=85",
      headline: "A Timeless Symbol of Love",
      description:
        "One of the world's most iconic monuments, the Taj Mahal is celebrated for its magnificent white marble architecture, intricate craftsmanship, and its enduring story of love built by Emperor Shah Jahan for his beloved queen Mumtaz Mahal.",
      order: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fd_2",
      name: "Mussoorie",
      countryId: "cnt_in",
      stateId: "st_uk",
      imageUrl:
        "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2400&q=85",
      headline: "Queen of the Hills",
      description:
        "Draped in cedar and oak, Mussoorie sits at 2,000 metres in the Garhwal Himalayas offering spectacular valley panoramas, colonial-era promenades, and a refreshing cool retreat from the plains throughout the year.",
      order: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fd_3",
      name: "Kerala Backwaters",
      countryId: "cnt_in",
      stateId: "st_ker",
      imageUrl:
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2400&q=85",
      headline: "Where Time Moves with the Tides",
      description:
        "A labyrinth of shimmering lagoons, canals, and emerald paddy fields, the Kerala Backwaters offer an unhurried escape aboard traditional houseboats, with swaying palms and village life unfolding at a gentle pace.",
      order: 3,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fd_4",
      name: "Hawa Mahal",
      countryId: "cnt_in",
      stateId: "st_raj",
      cityId: "ct_jaipur",
      imageUrl:
        "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=2400&q=85",
      headline: "Palace of the Winds",
      description:
        "Rising five stories in delicate pink sandstone, Hawa Mahal's 953 latticed windows were designed to let royal ladies observe street festivals while remaining veiled — a breathtaking fusion of Rajput and Mughal artistry in the heart of Jaipur.",
      order: 4,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fd_5",
      name: "Pangong Lake",
      countryId: "cnt_in",
      stateId: "st_uk",
      imageUrl:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85",
      headline: "A Mirror at the Roof of the World",
      description:
        "At 4,350 metres altitude in Ladakh, Pangong Lake's surreal blue waters shift from sapphire to turquoise as the day unfolds, framed by stark Himalayan ridges in one of India's most remote and breathtaking landscapes.",
      order: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fd_6",
      name: "Goa Beaches",
      countryId: "cnt_in",
      stateId: "st_goa",
      imageUrl:
        "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2400&q=85",
      headline: "Golden Shores, Endless Sunsets",
      description:
        "From the lively shores of North Goa to the tranquil coves of the south, Goa's beaches offer a rare blend of Portuguese colonial charm, tropical warmth, and a laid-back rhythm that invites travellers to arrive, breathe, and simply be.",
      order: 6,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ─── Persistence ─────────────────────────────────────────────────────────────
function ensureFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getInitialData(), null, 2), "utf-8");
  }
}

function persistToFile(items: FeaturedDestination[]): void {
  try {
    ensureFile();
    const tmp = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(items, null, 2), "utf-8");
    fs.renameSync(tmp, DATA_FILE);
    cache = items;
  } catch (err) {
    console.error("Failed to persist featured destinations:", err);
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────
export function getAllFeaturedDestinations(): FeaturedDestination[] {
  try {
    ensureFile();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cache = parsed;
      return parsed;
    }
  } catch {
    // fallback
  }
  const fallback = getInitialData();
  cache = fallback;
  return fallback;
}

// ─── Enriched public view (resolves location labels from destination DB) ──────
export interface EnrichedFeaturedDestination extends FeaturedDestination {
  locationLabel: string; // e.g. "Agra – Uttar Pradesh – India"
}

export function getPublicFeaturedDestinations(): EnrichedFeaturedDestination[] {
  const items = getAllFeaturedDestinations()
    .filter((d) => d.isActive)
    .sort((a, b) => a.order - b.order);

  const { countries, states, cities, areas } = getAllDestinations();

  return items.map((item) => {
    const parts: string[] = [];

    // Innermost → outermost: area → city → state → country
    if (item.areaId) {
      const area = areas.find((a) => a.id === item.areaId);
      if (area) parts.push(area.name);
    }
    if (item.cityId) {
      const city = cities.find((c) => c.id === item.cityId);
      if (city) parts.push(city.name);
    }
    if (item.stateId) {
      const state = states.find((s) => s.id === item.stateId);
      if (state) parts.push(state.name);
    }
    if (item.countryId) {
      const country = countries.find((c) => c.id === item.countryId);
      if (country) parts.push(country.name);
    }

    return {
      ...item,
      locationLabel: parts.join(" – "),
    };
  });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────
export function createFeaturedDestination(
  input: Omit<FeaturedDestination, "id" | "createdAt" | "updatedAt">
): FeaturedDestination {
  const items = getAllFeaturedDestinations();
  const now = new Date().toISOString();
  const id = `fd_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const newItem: FeaturedDestination = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };
  items.push(newItem);
  persistToFile(items);
  return newItem;
}

export function updateFeaturedDestination(
  id: string,
  updates: Partial<FeaturedDestination>
): FeaturedDestination | null {
  const items = getAllFeaturedDestinations();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = {
    ...items[idx],
    ...updates,
    id: items[idx].id,
    updatedAt: new Date().toISOString(),
  };
  persistToFile(items);
  return items[idx];
}

export function deleteFeaturedDestination(id: string): boolean {
  const items = getAllFeaturedDestinations();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  persistToFile(items);
  return true;
}

export function reorderFeaturedDestinations(orderedIds: string[]): FeaturedDestination[] {
  const items = getAllFeaturedDestinations();
  orderedIds.forEach((id, i) => {
    const item = items.find((x) => x.id === id);
    if (item) item.order = i + 1;
  });
  items.sort((a, b) => a.order - b.order);
  persistToFile(items);
  return items;
}
