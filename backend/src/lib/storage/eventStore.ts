import fs from "fs";
import path from "path";
import { EventRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "events.json");

let eventsCache: EventRecord[] | null = null;

function getInitialEvents(): EventRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: "evt-1",
      slug: "pushkar-balloon-heritage-fair-2026",
      title: "Pushkar International Hot Air Balloon & Heritage Fair",
      description: "Soar above the desert in dawn hot air balloon flights and witness majestic camel pageants, folk dancers, and evening sacred lake aartis.",
      coverImage: "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80",
      startDate: "2026-11-18",
      endDate: "2026-11-26",
      location: "Pushkar Fairgrounds, Mela Vikas Ground",
      city: "Pushkar",
      state: "Rajasthan",
      category: "Festival",
      registrationLink: "https://example.com/pushkar-pass",
      status: "published",
      featured: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "evt-2",
      slug: "goa-sunsplash-beachside-acoustic-festival",
      title: "Goa Sunsplash & Beachside Acoustic Sunset Festival",
      description: "Three sun-soaked days of global reggae, acoustic live bands, yoga workshops, and artisan beach shack dining by the Arabian waves.",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      startDate: "2026-12-04",
      endDate: "2026-12-06",
      location: "Riva Beach Resort & Lawns, Mandrem",
      city: "Goa",
      state: "Goa",
      category: "Music",
      registrationLink: "https://example.com/goa-sunsplash",
      status: "published",
      featured: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "evt-3",
      slug: "rann-utsav-white-desert-full-moon-gala",
      title: "Rann Utsav: White Desert Full Moon Gala",
      description: "Marvel at shimmering salt flats illuminated by full moonlight with authentic Kutchi cuisine, camel cart safaris, and midnight Sufi music.",
      coverImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
      startDate: "2026-12-15",
      endDate: "2026-12-18",
      location: "Tent City Grounds, Dhordo",
      city: "Kutch",
      state: "Gujarat",
      category: "Cultural",
      registrationLink: "https://example.com/rann-utsav",
      status: "published",
      featured: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialEvents();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function getAllEvents(): EventRecord[] {
  if (eventsCache !== null) {
    return eventsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    eventsCache = Array.isArray(parsed) ? parsed : [];
    return eventsCache;
  } catch (error) {
    console.error("Backend Event Storage Error:", error);
    eventsCache = [];
    return eventsCache;
  }
}

export function saveEvents(events: EventRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(events, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    eventsCache = events;
  } catch (error) {
    console.error("Backend Event Storage Error: Failed to persist:", error);
    throw new Error("Failed to persist event records.");
  }
}

export function findEventById(id: string): EventRecord | null {
  const events = getAllEvents();
  return events.find((e) => e.id === id) || null;
}

export function createEvent(data: Omit<EventRecord, "id" | "createdAt" | "updatedAt">): EventRecord {
  const events = getAllEvents();
  const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existing = events.find((e) => e.slug === slug);
  if (existing) {
    throw new Error(`An event with slug "${slug}" already exists.`);
  }

  const now = new Date().toISOString();
  const newEvent: EventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  events.unshift(newEvent);
  saveEvents(events);
  return newEvent;
}

export function updateEvent(id: string, updates: Partial<EventRecord>): EventRecord {
  const events = getAllEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error("Event not found.");
  }

  if (updates.slug) {
    const slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const clash = events.find((e) => e.slug === slug && e.id !== id);
    if (clash) {
      throw new Error(`Slug "${slug}" is already in use by another event.`);
    }
    updates.slug = slug;
  }

  const now = new Date().toISOString();
  const updated: EventRecord = {
    ...events[index],
    ...updates,
    updatedAt: now,
  };

  events[index] = updated;
  saveEvents(events);
  return updated;
}

export function deleteEvent(id: string): void {
  const events = getAllEvents();
  const filtered = events.filter((e) => e.id !== id);
  saveEvents(filtered);
}

/** Alias for findEventById — used by route handlers */
export const getEventById = findEventById;

/** Returns only published events */
export function getPublishedEvents() {
  return getAllEvents().filter((e) => e.status === "published");
}
