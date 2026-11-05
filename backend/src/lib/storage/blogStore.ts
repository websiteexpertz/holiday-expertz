import fs from "fs";
import path from "path";
import { BlogPostRecord } from "../../types/admin";
import { normalizeCategorySlug, getAllCategories } from "./blogCategoryStore";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "blogs.json");

let blogsCache: BlogPostRecord[] | null = null;

function mapCategoryToSlug(categoryName?: string, categorySlug?: string): { category: string; categorySlug: string } {
  if (categorySlug) {
    const categories = getAllCategories();
    const match = categories.find((c) => c.slug.toLowerCase() === categorySlug.toLowerCase());
    if (match) {
      return { category: match.name, categorySlug: match.slug };
    }
  }

  const normalized = (categoryName || "").trim().toLowerCase();
  if (normalized.includes("tip")) {
    return { category: "Travel Tips", categorySlug: "travel-tips" };
  }
  if (normalized.includes("destination") || normalized.includes("himalaya")) {
    return { category: "Destination Guides", categorySlug: "destination-guides" };
  }
  if (normalized.includes("heritage") || normalized.includes("culture") || normalized.includes("inspiration")) {
    return { category: "Travel Inspiration", categorySlug: "travel-inspiration" };
  }
  if (normalized.includes("resort") || normalized.includes("hotel")) {
    return { category: "Hotel & Resort Guides", categorySlug: "hotel-resort-guides" };
  }
  if (normalized.includes("experience")) {
    return { category: "Experiences", categorySlug: "experiences" };
  }
  if (normalized.includes("weekend") || normalized.includes("luxury") || normalized.includes("escape")) {
    return { category: "Luxury Stays", categorySlug: "luxury-stays" };
  }

  const generatedSlug = normalizeCategorySlug(categoryName || "Destination Guides") || "destination-guides";
  return {
    category: categoryName?.trim() || "Destination Guides",
    categorySlug: generatedSlug,
  };
}

function getInitialBlogs(): BlogPostRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: "blog-1",
      slug: "best-weekend-getaways-india",
      title: "10 Best Weekend Getaways in India for Quick Rejuvenation",
      excerpt: "From mist-cloaked tea estates in Coorg to royal haveli evenings in Jaipur, explore top handpicked destinations within a short drive or direct flight.",
      content: `India offers an unmatched spectrum of weekend respites. Whether craving the crisp pine breezes of Himachal or the heritage charm of Rajasthani courtyards, planning a two-night rejuvenation requires choosing verified boutique stays with prompt hospitality and farm-fresh regional dining.

### Coorg: Emerald Hills & Aromatic Plantations
Nestled in Karnataka's Western Ghats, Coorg remains one of South India's premier weekend sanctuaries. Awaken to the aroma of freshly roasted Arabica beans, wander through private coffee trails, and retreat to secluded infinity-pool villas nestled among lush rainforest canopies.

### Udaipur: The Royal Waterfront Charm
Few experiences rival dusk falling over Lake Pichola. Heritage havelis adorned with hand-carved jharokhas provide a tranquil window into Rajasthan's royal hospitality, where evening folk recitals and private boat cruises craft an unforgettable weekend retreat.

### Mussoorie: Colonial Heritage & Ridge Strolls
Perched upon the Garhwal Himalayan foothills, Mussoorie offers misty pine trails, sun-drenched colonial verandas, and panoramic vistas of the snow-clad peaks. Choosing a mountain cottage along the Camel's Back Road ensures peace and acoustic tranquility away from weekend rush.`,
      featuredImage: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=80",
      category: "Luxury Stays",
      categorySlug: "luxury-stays",
      author: "Aarav Sharma",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      authorRole: "Senior Travel Curator",
      readTime: "5 min read",
      status: "published",
      featured: true,
      isInformative: true,
      tags: ["Weekend", "India", "Resorts", "Nature"],
      publishedAt: "2026-10-14T10:00:00.000Z",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "blog-2",
      slug: "how-to-choose-the-perfect-hotel",
      title: "How to Choose the Perfect Hotel: An Insider's Booking Guide",
      excerpt: "Learn how to decipher guest reviews, evaluate location advantages, spot hidden amenities, and unlock authentic luxury without overspending.",
      content: `Navigating online booking can be daunting with filtered photos and promotional descriptions. Prioritize verified host properties where direct contact and transparent room specifications are guaranteed.

### Step 1: Decode Verified Reviews
Look beyond overall score averages and evaluate reviews published within the last 90 days. Focus on remarks covering bed linen cleanliness, air conditioning quietness, water pressure, and Wi-Fi stability for remote work.

### Step 2: Location vs. Accessibility
A resort perched high on an isolated ridge sounds idyllic until evening dinner requires a steep forty-minute mountain drive. Verify on-site dining choices and road connectivity before confirming reservations.

### Step 3: Transparent Pricing & Hidden Extras
Always review whether taxes, breakfast spreads, resort facility charges, and airport concierge shuttles are bundled or billed additionally upon checkout.`,
      featuredImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      category: "Travel Tips",
      categorySlug: "travel-tips",
      author: "Pooja Malhotra",
      authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
      authorRole: "Hospitality Specialist",
      readTime: "7 min read",
      status: "published",
      featured: true,
      tags: ["Hotels", "Booking Tips", "Luxury"],
      publishedAt: "2026-10-08T10:00:00.000Z",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "blog-3",
      slug: "planning-mountain-holiday-himalayas",
      title: "Planning a Memorable Mountain Holiday in the Indian Himalayas",
      excerpt: "Essential tips on packing for high altitudes, discovering quiet offbeat valleys in Himachal and Uttarakhand, and booking scenic ridge-view cottages.",
      content: `The Himalayas in North India beckon travelers with quiet pine forests, snow-clad mountain passes, and cozy cedarwood cottages. For an authentic stay, reserve verified mountain villas with fireplaces and heated rooms, and arrange local transfers well before dusk.

### Best Mountain Valleys for Quiet Retreats
- **Jibhi & Tirthan Valley (Himachal):** Pristine river streams, traditional Kathkuni architecture, and peaceful forest trails along the Great Himalayan National Park.
- **Mukteshwar (Uttarakhand):** Apple orchards, 180-degree panoramas of Nanda Devi, and birdwatching sanctuaries.
- **Dharamkot (Himachal):** Pine-cloaked ridges, artisan cafés, and tranquil meditation retreats high above McLeodGanj.

### Essential High-Altitude Travel Advice
Acclimatize at moderate elevations before ascending higher ridges. Pack layered woolens, insulated thermal wear, and reliable trekking footwear. Always confirm road conditions during monsoon and heavy winter snowfall periods.`,
      featuredImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      category: "Destination Guides",
      categorySlug: "destination-guides",
      author: "Rohan Varma",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      authorRole: "Adventure & Alpine Guide",
      readTime: "6 min read",
      status: "published",
      featured: false,
      tags: ["Mountains", "Himalayas", "Uttarakhand", "Himachal"],
      publishedAt: "2026-09-29T10:00:00.000Z",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "blog-4",
      slug: "heritage-palaces-forts-rajasthan",
      title: "Heritage Trail: The Living Palaces and Forts of Rajasthan",
      excerpt: "Wander through ornate jharokhas, courtyards of Udaipur and Jaipur, and discover palace properties where royal hospitality is preserved today.",
      content: `Rajasthan's regal legacy is best experienced within living palaces and boutique havelis. Savor authentic Mewari dishes prepared by royal chefs, stroll through mirrored courtyards, and discover the history behind hand-painted frescoes.

### Living Architectural Heritage
Staying within a restored fortress or haveli is not merely accommodation; it is an intimate encounter with centuries of Rajasthani history. From sandstone arches that glow amber under sunset skies to sprawling fountains and peacock courtyards, heritage properties offer unparalleled majesty.

### What to Look for in a Heritage Stay
1. **Restoration Integrity:** Properties that honor regional Shekhawati frescoes, marble inlay works, and teakwood pillars while offering modern climate control and luxury amenities.
2. **Royal Gastronomy:** Dining experiences curated with age-old secret recipes, slow-cooked curries in copper handis, and rooftop tables overlooking illuminated fortresses.`,
      featuredImage: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      category: "Travel Inspiration",
      categorySlug: "travel-inspiration",
      author: "Ananya Roy",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      authorRole: "Heritage Historian",
      readTime: "8 min read",
      status: "published",
      featured: true,
      tags: ["Rajasthan", "Udaipur", "Palaces", "Heritage"],
      publishedAt: "2026-09-21T10:00:00.000Z",
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
    const initial = getInitialBlogs();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function getAllBlogs(): BlogPostRecord[] {
  if (blogsCache !== null) {
    return blogsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    const rawList: BlogPostRecord[] = Array.isArray(parsed) && parsed.length > 0 ? parsed : getInitialBlogs();

    // Ensure categorySlug and clean slugs are present on all records
    let hasChanges = false;
    blogsCache = rawList.map((b) => {
      const { category, categorySlug } = mapCategoryToSlug(b.category, b.categorySlug);
      const cleanSlug = (b.slug || b.title).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (b.categorySlug !== categorySlug || b.slug !== cleanSlug || !b.category) {
        hasChanges = true;
        return {
          ...b,
          slug: cleanSlug,
          category,
          categorySlug,
        };
      }
      return b;
    });

    if (hasChanges) {
      saveBlogs(blogsCache);
    }

    return blogsCache;
  } catch (error) {
    console.error("Backend Blog Storage Error:", error);
    blogsCache = getInitialBlogs();
    return blogsCache;
  }
}

export function saveBlogs(blogs: BlogPostRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(blogs, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    blogsCache = blogs;
  } catch (error) {
    console.error("Backend Blog Storage Error: Failed to persist:", error);
    throw new Error("Failed to persist blog records.");
  }
}

export function findBlogById(id: string): BlogPostRecord | null {
  const blogs = getAllBlogs();
  return blogs.find((b) => b.id === id) || null;
}

export function findBlogBySlug(slug: string): BlogPostRecord | null {
  const clean = slug.trim().toLowerCase();
  const blogs = getAllBlogs();
  return blogs.find((b) => b.slug.toLowerCase() === clean) || null;
}

export function getPublishedBlogBySlug(slug: string): BlogPostRecord | null {
  const blog = findBlogBySlug(slug);
  if (!blog || blog.status !== "published") {
    return null;
  }
  return blog;
}

export function getPublishedBlogs(options?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
  page?: number;
  featured?: boolean;
}): { blogs: BlogPostRecord[]; total: number; totalPages: number } {
  let list = getAllBlogs().filter((b) => b.status === "published");

  if (options?.categorySlug && options.categorySlug !== "all") {
    const targetSlug = options.categorySlug.toLowerCase().trim();
    list = list.filter((b) => (b.categorySlug || "").toLowerCase() === targetSlug);
  }

  if (options?.featured) {
    list = list.filter((b) => b.featured);
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
    );
  }

  // Sort: Informative articles appear up front, then ordered by publishedAt descending
  list.sort((a, b) => {
    const aInf = Boolean(a.isInformative);
    const bInf = Boolean(b.isInformative);
    if (aInf !== bInf) return aInf ? -1 : 1;
    return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
  });

  const total = list.length;
  const limit = options?.limit && options.limit > 0 ? options.limit : 0;
  const page = options?.page && options.page > 0 ? options.page : 1;

  if (limit > 0) {
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit);
    return {
      blogs: paginated,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  return {
    blogs: list,
    total,
    totalPages: 1,
  };
}

export function getRelatedBlogs(currentSlug: string, categorySlug?: string, limit = 3): BlogPostRecord[] {
  const allPublished = getAllBlogs()
    .filter((b) => b.status === "published" && b.slug.toLowerCase() !== currentSlug.toLowerCase())
    .sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

  let related: BlogPostRecord[] = [];

  if (categorySlug) {
    related = allPublished.filter((b) => (b.categorySlug || "").toLowerCase() === categorySlug.toLowerCase());
  }

  if (related.length < limit) {
    const remainingNeeded = limit - related.length;
    const existingIds = new Set(related.map((b) => b.id));
    const fallback = allPublished.filter((b) => !existingIds.has(b.id)).slice(0, remainingNeeded);
    related = [...related, ...fallback];
  }

  return related.slice(0, limit);
}

export function getCategoryBlogCounts(): Record<string, number> {
  const published = getAllBlogs().filter((b) => b.status === "published");
  const counts: Record<string, number> = {};

  for (const b of published) {
    const slug = b.categorySlug || mapCategoryToSlug(b.category).categorySlug;
    counts[slug] = (counts[slug] || 0) + 1;
  }

  return counts;
}

export function createBlog(data: Omit<BlogPostRecord, "id" | "createdAt" | "updatedAt">): BlogPostRecord {
  const blogs = getAllBlogs();
  const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existingSlug = blogs.find((b) => b.slug === slug);
  if (existingSlug) {
    throw new Error(`A blog with slug "${slug}" already exists.`);
  }

  const { category, categorySlug } = mapCategoryToSlug(data.category, data.categorySlug);
  const now = new Date().toISOString();

  const newBlog: BlogPostRecord = {
    id: `blog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    slug,
    category,
    categorySlug,
    isInformative: Boolean(data.isInformative),
    createdAt: now,
    updatedAt: now,
    publishedAt: data.publishedAt
      ? new Date(data.publishedAt).toISOString()
      : data.status === "published"
      ? now
      : undefined,
  };

  blogs.unshift(newBlog);
  saveBlogs(blogs);
  return newBlog;
}

export function updateBlog(id: string, updates: Partial<BlogPostRecord>): BlogPostRecord {
  const blogs = getAllBlogs();
  const index = blogs.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error("Blog post not found.");
  }

  if (updates.slug) {
    const slug = updates.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const clash = blogs.find((b) => b.slug === slug && b.id !== id);
    if (clash) {
      throw new Error(`Slug "${slug}" is already in use by another article.`);
    }
    updates.slug = slug;
  }

  if (updates.category || updates.categorySlug) {
    const { category, categorySlug } = mapCategoryToSlug(
      updates.category || blogs[index].category,
      updates.categorySlug || blogs[index].categorySlug
    );
    updates.category = category;
    updates.categorySlug = categorySlug;
  }

  const now = new Date().toISOString();
  const updated: BlogPostRecord = {
    ...blogs[index],
    ...updates,
    isInformative:
      updates.isInformative !== undefined
        ? Boolean(updates.isInformative)
        : blogs[index].isInformative,
    updatedAt: now,
    publishedAt:
      updates.publishedAt !== undefined
        ? updates.publishedAt
          ? new Date(updates.publishedAt).toISOString()
          : undefined
        : updates.status === "published" && !blogs[index].publishedAt
        ? now
        : blogs[index].publishedAt,
  };

  blogs[index] = updated;
  saveBlogs(blogs);
  return updated;
}

export function deleteBlog(id: string): void {
  const blogs = getAllBlogs();
  const filtered = blogs.filter((b) => b.id !== id);
  saveBlogs(filtered);
}

/** Alias for findBlogById — used by route handlers */
export const getBlogById = findBlogById;
