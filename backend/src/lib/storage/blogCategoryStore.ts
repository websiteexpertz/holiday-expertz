import fs from "fs";
import path from "path";
import { BlogCategoryRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "blogCategories.json");

let categoriesCache: BlogCategoryRecord[] | null = null;

export const DEFAULT_BLOG_CATEGORIES: BlogCategoryRecord[] = [
  {
    id: "cat-destination-guides",
    name: "Destination Guides",
    slug: "destination-guides",
    description: "Curated itineraries, regional insights, and handpicked local experiences across India and beyond.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    order: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "cat-luxury-stays",
    name: "Luxury Stays",
    slug: "luxury-stays",
    description: "Private villas, palace havelis, and five-star boutique retreats that redefine elevated hospitality.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    order: 2,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "cat-travel-inspiration",
    name: "Travel Inspiration",
    slug: "travel-inspiration",
    description: "Captivating stories, timeless journeys, and seasonal escapes to spark your next adventure.",
    image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    order: 3,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "cat-travel-tips",
    name: "Travel Tips",
    slug: "travel-tips",
    description: "Insider advice, packing wisdom, booking strategies, and practical pointers for effortless travel.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    order: 4,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "cat-experiences",
    name: "Experiences",
    slug: "experiences",
    description: "Immersive cultural encounters, culinary trails, wellness sanctuaries, and thrilling excursions.",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    order: 5,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
  },
  {
    id: "cat-hotel-resort-guides",
    name: "Hotel & Resort Guides",
    slug: "hotel-resort-guides",
    description: "In-depth reviews, architectural tours, and insider overviews of world-class resort properties.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    isActive: true,
    order: 6,
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
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_BLOG_CATEGORIES, null, 2), "utf-8");
  }
}

export function getAllCategories(): BlogCategoryRecord[] {
  if (categoriesCache !== null) {
    return categoriesCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    categoriesCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_BLOG_CATEGORIES;
    return categoriesCache;
  } catch (error) {
    console.error("Backend Blog Category Storage Error:", error);
    categoriesCache = DEFAULT_BLOG_CATEGORIES;
    return categoriesCache;
  }
}

export function saveCategories(categories: BlogCategoryRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(categories, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    categoriesCache = categories;
  } catch (error) {
    console.error("Backend Category Storage Error: Failed to persist:", error);
    throw new Error("Failed to persist blog category records.");
  }
}

export function getActiveCategories(): BlogCategoryRecord[] {
  return getAllCategories()
    .filter((c) => c.isActive)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function findCategoryById(id: string): BlogCategoryRecord | null {
  const categories = getAllCategories();
  return categories.find((c) => c.id === id) || null;
}

export function findCategoryBySlug(slug: string): BlogCategoryRecord | null {
  const categories = getAllCategories();
  return categories.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export function normalizeCategorySlug(nameOrSlug: string): string {
  return nameOrSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  order?: number;
}): BlogCategoryRecord {
  const categories = getAllCategories();
  const slug = data.slug ? normalizeCategorySlug(data.slug) : normalizeCategorySlug(data.name);

  if (!slug) {
    throw new Error("Category name or slug is required.");
  }

  const existingSlug = categories.find((c) => c.slug === slug);
  if (existingSlug) {
    throw new Error(`A category with slug "${slug}" already exists.`);
  }

  const existingName = categories.find((c) => c.name.toLowerCase() === data.name.trim().toLowerCase());
  if (existingName) {
    throw new Error(`A category named "${data.name.trim()}" already exists.`);
  }

  const now = new Date().toISOString();
  const newCat: BlogCategoryRecord = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: data.name.trim(),
    slug,
    description: data.description?.trim(),
    image: data.image?.trim(),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    order: data.order ?? categories.length + 1,
    createdAt: now,
    updatedAt: now,
  };

  categories.push(newCat);
  saveCategories(categories);
  return newCat;
}

export function updateCategory(
  id: string,
  updates: Partial<Omit<BlogCategoryRecord, "id" | "createdAt">>
): BlogCategoryRecord {
  const categories = getAllCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Blog category not found.");
  }

  if (updates.slug) {
    const slug = normalizeCategorySlug(updates.slug);
    const clash = categories.find((c) => c.slug === slug && c.id !== id);
    if (clash) {
      throw new Error(`Category slug "${slug}" is already in use.`);
    }
    updates.slug = slug;
  }

  if (updates.name) {
    const clashName = categories.find(
      (c) => c.name.toLowerCase() === updates.name!.trim().toLowerCase() && c.id !== id
    );
    if (clashName) {
      throw new Error(`A category named "${updates.name!.trim()}" already exists.`);
    }
    updates.name = updates.name.trim();
  }

  const now = new Date().toISOString();
  const updated: BlogCategoryRecord = {
    ...categories[index],
    ...updates,
    updatedAt: now,
  };

  categories[index] = updated;
  saveCategories(categories);
  return updated;
}

export function deleteCategory(id: string): void {
  const categories = getAllCategories();
  const filtered = categories.filter((c) => c.id !== id);
  saveCategories(filtered);
}
