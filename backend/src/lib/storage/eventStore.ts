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
  const rawSlug = data.slug || data.title;
  let slug = rawSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) slug = `event-${Date.now()}`;

  const existing = events.find((e) => e.slug === slug);
  if (existing) {
    // Append unique suffix if collision occurs
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const now = new Date().toISOString();
  const newEvent: EventRecord = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    slug,
    timezone: data.timezone || "Asia/Kolkata",
    country: data.country || "India",
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    status: data.status || "published",
    featured: Boolean(data.featured),
    source: data.source || "manual",
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

/**
 * Checks whether an event is currently live and eligible for public display.
 * - status MUST be "published" (drafts, archived are excluded).
 * - If publishAt is set: current time >= publishAt.
 * - If unpublishAt is set: current time < unpublishAt.
 */
export function isEventLive(event: EventRecord, now = new Date()): boolean {
  if (event.status !== "published") return false;

  if (event.publishAt) {
    const pubDate = new Date(event.publishAt);
    if (!isNaN(pubDate.getTime()) && now < pubDate) {
      return false; // Scheduled publication date has not arrived yet
    }
  }

  if (event.unpublishAt) {
    const unpubDate = new Date(event.unpublishAt);
    if (!isNaN(unpubDate.getTime()) && now >= unpubDate) {
      return false; // Scheduled unpublication date has passed
    }
  }

  return true;
}

/**
 * Checks whether an event has not expired yet based on its end date.
 * Returns true if event end date is today or in the future.
 */
export function isEventUpcoming(event: EventRecord, now = new Date()): boolean {
  if (!event.endDate && !event.startDate) return false;
  const targetDateStr = event.endDate || event.startDate;
  const eventEnd = new Date(targetDateStr + "T23:59:59");
  return eventEnd.getTime() >= now.getTime();
}

/**
 * Clones an existing annual/recurring event for a new calendar year occurrence as a draft.
 * Retains main branding, description, highlights, location and assets.
 */
export function duplicateEventForYear(
  sourceId: string,
  targetYear: number,
  newDates?: { startDate?: string; endDate?: string }
): EventRecord {
  const source = findEventById(sourceId);
  if (!source) {
    throw new Error("Source event not found.");
  }

  const seriesId = source.seriesId || source.id;

  // Calculate default dates for the new year if not provided
  let newStart = newDates?.startDate;
  let newEnd = newDates?.endDate;

  if (!newStart && source.startDate) {
    const oldStart = new Date(source.startDate + "T00:00:00");
    const m = String(oldStart.getMonth() + 1).padStart(2, "0");
    const d = String(oldStart.getDate()).padStart(2, "0");
    newStart = `${targetYear}-${m}-${d}`;
  }

  if (!newEnd && (source.endDate || source.startDate)) {
    const oldEnd = new Date((source.endDate || source.startDate) + "T00:00:00");
    const m = String(oldEnd.getMonth() + 1).padStart(2, "0");
    const d = String(oldEnd.getDate()).padStart(2, "0");
    newEnd = `${targetYear}-${m}-${d}`;
  }

  // Generate unique slug with target year
  const baseSlug = source.slug.replace(/-\d{4}$/, "");
  const newSlug = `${baseSlug}-${targetYear}`;

  return createEvent({
    title: source.title.replace(/\b\d{4}\b/, String(targetYear)),
    slug: newSlug,
    description: source.description,
    longDescription: source.longDescription,
    coverImage: source.coverImage,
    startDate: newStart || `${targetYear}-11-01`,
    endDate: newEnd || `${targetYear}-11-05`,
    time: source.time,
    location: source.location,
    city: source.city,
    state: source.state,
    country: source.country || "India",
    category: source.category,
    price: source.price,
    highlights: source.highlights ? [...source.highlights] : [],
    organizer: source.organizer,
    registrationLink: source.registrationLink,
    status: "draft", // Stored as draft until admin verifies exact year dates
    featured: source.featured,
    timezone: source.timezone || "Asia/Kolkata",
    isRecurring: true,
    recurrenceFrequency: "annual",
    seriesId,
    editionYear: targetYear,
    source: "manual",
  });
}

/** Alias for findEventById — used by route handlers */
export const getEventById = findEventById;

/** Returns eligible published events (filtered by publication status and scheduled dates) */
export function getPublishedEvents(options?: {
  includeExpired?: boolean;
  now?: Date;
}): EventRecord[] {
  const now = options?.now || new Date();
  return getAllEvents().filter((e) => {
    if (!isEventLive(e, now)) return false;
    if (options?.includeExpired === false && !isEventUpcoming(e, now)) return false;
    return true;
  });
}
