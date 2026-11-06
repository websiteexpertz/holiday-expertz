import fs from "fs";
import path from "path";
import { DealRecord } from "../../types/admin";
import { connectToDatabase } from "../db/mongodb";
import { DealModel } from "../models/Deal";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "deals.json");

let dealsCache: DealRecord[] | null = null;

const SEED_DEALS: DealRecord[] = [
  {
    id: "deal-weekend",
    slug: "weekend-getaways-special",
    title: "Weekend Getaways",
    description: "Escape the city hustle with curated Friday-to-Sunday retreats. Enjoy complimentary breakfasts, late checkout, and resort credits.",
    promoImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    discountType: "percentage",
    discountValue: 25,
    couponCode: "WEEKEND25",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    applicableCategory: "Weekend Stays",
    status: "active",
    featured: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "deal-luxury",
    slug: "royal-luxury-palace-escapes",
    title: "Luxury Stay Offers",
    description: "Indulge in royal heritage suites, private plunge pools, and Michelin-inspired culinary dining with complimentary airport transfers.",
    promoImage: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    discountType: "fixed",
    discountValue: 7500,
    couponCode: "ROYAL7500",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    applicableCategory: "Luxury Hotels",
    status: "active",
    featured: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "deal-family",
    slug: "spacious-family-holiday-package",
    title: "Family Holiday Packages",
    description: "Multi-room villas and interconnected suites featuring kids-stay-free privileges, outdoor recreation, and fun adventure safaris.",
    promoImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
    discountType: "percentage",
    discountValue: 20,
    couponCode: "FAMILY20",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    applicableCategory: "Villas",
    status: "active",
    featured: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "deal-romantic",
    slug: "romantic-escapes-honeymoon-retreats",
    title: "Romantic Escapes & Honeymoon",
    description: "Private cliffside cottages, floral bath rituals, champagne arrivals, and bespoke candlelight dining overlooking calm waters.",
    promoImage: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    discountType: "fixed",
    discountValue: 6000,
    couponCode: "HONEYMOON6000",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    applicableCategory: "Boutique Stays",
    status: "active",
    featured: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "deal-workation",
    slug: "workation-himalayan-extended-stays",
    title: "Workation & Extended Stays",
    description: "Trade city walls for Himalayan cedar balconies or serene Goan villas with ergonomic workstations and weekly laundry perks.",
    promoImage: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
    discountType: "percentage",
    discountValue: 30,
    couponCode: "WORKATION30",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    applicableCategory: "Homestays",
    status: "active",
    featured: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_DEALS, null, 2), "utf-8");
  }
}

export function getAllDeals(): DealRecord[] {
  if (dealsCache !== null) {
    return dealsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    dealsCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_DEALS;
    return dealsCache;
  } catch (error) {
    console.error("Backend Deal Storage Error:", error);
    dealsCache = SEED_DEALS;
    return dealsCache;
  }
}

export function saveDeals(deals: DealRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(deals, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    dealsCache = deals;
  } catch (error) {
    console.error("Failed to persist deals:", error);
    throw new Error("Failed to persist deals to storage.");
  }
}

export function getDealById(id: string): DealRecord | undefined {
  return getAllDeals().find((d) => d.id === id);
}

export function getDealBySlug(slug: string): DealRecord | undefined {
  return getAllDeals().find((d) => d.slug.toLowerCase() === slug.toLowerCase());
}

export function createDeal(input: Omit<DealRecord, "id" | "createdAt" | "updatedAt">): DealRecord {
  const deals = getAllDeals();
  const id = `deal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  let slug = input.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) {
    slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  // Ensure unique slug
  let finalSlug = slug;
  let counter = 1;
  while (deals.some((d) => d.slug === finalSlug)) {
    finalSlug = `${slug}-${counter++}`;
  }

  const record: DealRecord = {
    ...input,
    id,
    slug: finalSlug,
    createdAt: now,
    updatedAt: now,
  };

  deals.unshift(record);
  saveDeals(deals);
  return record;
}

export function updateDeal(id: string, updates: Partial<DealRecord>): DealRecord | null {
  const deals = getAllDeals();
  const index = deals.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const current = deals[index];
  const updated: DealRecord = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
  };

  deals[index] = updated;
  saveDeals(deals);
  return updated;
}

export function deleteDeal(id: string): boolean {
  const deals = getAllDeals();
  const index = deals.findIndex((d) => d.id === id);
  if (index === -1) return false;

  deals.splice(index, 1);
  saveDeals(deals);
  return true;
}

export function getActiveDeals(): DealRecord[] {
  return getAllDeals().filter((d) => d.status === "active");
}

export async function getAllDealsAsync(): Promise<DealRecord[]> {
  try {
    await connectToDatabase();
    const deals = await DealModel.find().sort({ createdAt: -1 }).lean();
    if (deals.length > 0) {
      return deals as unknown as DealRecord[];
    }
  } catch (error) {
    console.warn("MongoDB deal read fallback:", error instanceof Error ? error.message : error);
  }
  return getAllDeals();
}

export async function createDealAsync(
  input: Omit<DealRecord, "id" | "createdAt" | "updatedAt">
): Promise<DealRecord> {
  const deals = getAllDeals();
  const id = `deal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const baseSlug = input.slug?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let counter = 1;
  while (deals.some((d) => d.slug === slug)) slug = `${baseSlug}-${counter++}`;

  const record: DealRecord = { ...input, id, slug, createdAt: now, updatedAt: now };
  await connectToDatabase();
  await DealModel.create(record);
  deals.unshift(record);
  dealsCache = deals;
  return record;
}

export async function updateDealAsync(id: string, updates: Partial<DealRecord>): Promise<DealRecord | null> {
  await connectToDatabase();
  const updated = await DealModel.findOneAndUpdate(
    { id },
    { ...updates, id, updatedAt: new Date().toISOString() },
    { new: true, runValidators: true }
  ).lean();
  return (updated as unknown as DealRecord | null) || null;
}

export async function deleteDealAsync(id: string): Promise<boolean> {
  await connectToDatabase();
  const result = await DealModel.deleteOne({ id });
  return result.deletedCount > 0;
}
