import fs from "fs";
import path from "path";
import { getAllProperties } from "./propertyStore";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "handpicked.json");

export interface HandpickedItem {
  id: string; // handpicked entry id
  propertyId: string;
  badge?: string;
  priorityOrder: number;
  featuredQuote?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

let handpickedCache: HandpickedItem[] | null = null;

const SEED_HANDPICKED: HandpickedItem[] = [
  {
    id: "hp-1",
    propertyId: "prop_1792595900000_a1b2c3d4",
    badge: "Royal Heritage",
    priorityOrder: 1,
    featuredQuote: "A mesmerizing 18th-century Rajput palace with royal courtyards and Aravali lake views.",
    isActive: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "hp-2",
    propertyId: "h-1",
    badge: "Iconic Lake Palace",
    priorityOrder: 2,
    featuredQuote: "Spread over 50 acres on the banks of Lake Pichola with tranquil reflection pools.",
    isActive: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "hp-3",
    propertyId: "h-2",
    badge: "Beach Sanctuary",
    priorityOrder: 3,
    featuredQuote: "Sun-drenched Mediterranean sanctuary with private pool villas and white sands.",
    isActive: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
];

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_HANDPICKED, null, 2), "utf-8");
  }
}

export function getAllHandpicked(): HandpickedItem[] {
  if (handpickedCache !== null) {
    return handpickedCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    handpickedCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_HANDPICKED;
    return handpickedCache;
  } catch (error) {
    console.error("Backend Handpicked Storage Error:", error);
    handpickedCache = SEED_HANDPICKED;
    return handpickedCache;
  }
}

export function saveHandpicked(items: HandpickedItem[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(items, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    handpickedCache = items;
  } catch (error) {
    console.error("Failed to persist handpicked:", error);
    throw new Error("Failed to persist handpicked items.");
  }
}

export function addHandpickedItem(input: {
  propertyId: string;
  badge?: string;
  priorityOrder?: number;
  featuredQuote?: string;
}): HandpickedItem {
  const items = getAllHandpicked();
  const existing = items.find((i) => i.propertyId === input.propertyId);
  if (existing) {
    existing.isActive = true;
    if (input.badge) existing.badge = input.badge;
    if (input.priorityOrder !== undefined) existing.priorityOrder = input.priorityOrder;
    if (input.featuredQuote) existing.featuredQuote = input.featuredQuote;
    existing.updatedAt = new Date().toISOString();
    saveHandpicked(items);
    return existing;
  }

  const id = `hp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newItem: HandpickedItem = {
    id,
    propertyId: input.propertyId,
    badge: input.badge || "Handpicked",
    priorityOrder: input.priorityOrder || items.length + 1,
    featuredQuote: input.featuredQuote,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  items.push(newItem);
  saveHandpicked(items);
  return newItem;
}

export function removeHandpickedItem(idOrPropertyId: string): boolean {
  const items = getAllHandpicked();
  const index = items.findIndex((i) => i.id === idOrPropertyId || i.propertyId === idOrPropertyId);
  if (index === -1) return false;

  items.splice(index, 1);
  saveHandpicked(items);
  return true;
}

export function updateHandpickedItem(id: string, updates: Partial<HandpickedItem>): HandpickedItem | null {
  const items = getAllHandpicked();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...updates,
    id: items[index].id,
    updatedAt: new Date().toISOString(),
  };

  saveHandpicked(items);
  return items[index];
}

export function getPublicHandpickedProperties() {
  const items = getAllHandpicked().filter((i) => i.isActive).sort((a, b) => a.priorityOrder - b.priorityOrder);
  const allProps = getAllProperties();

  return items.map((item) => {
    const prop = allProps.find((p) => p.id === item.propertyId);
    return {
      handpickedConfig: item,
      property: prop || null,
    };
  });
}
