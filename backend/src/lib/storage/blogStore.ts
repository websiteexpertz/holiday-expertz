import fs from "fs";
import path from "path";
import { BlogPostRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "blogs.json");

let blogsCache: BlogPostRecord[] | null = null;

function getInitialBlogs(): BlogPostRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: "blog-1",
      slug: "best-weekend-getaways-india",
      title: "10 Best Weekend Getaways in India for Quick Rejuvenation",
      excerpt: "From mist-cloaked tea estates in Coorg to royal haveli evenings in Jaipur, explore top handpicked destinations within a short drive or direct flight.",
      content: "India offers an unmatched spectrum of weekend respites. Whether craving the crisp pine breezes of Himachal or the heritage charm of Rajasthani courtyards, planning a two-night rejuvenation requires choosing verified boutique stays with prompt hospitality and farm-fresh regional dining.",
      featuredImage: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=80",
      category: "Weekend Escapes",
      author: "Aarav Sharma",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      readTime: "5 min read",
      status: "published",
      featured: true,
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
      content: "Navigating online booking can be daunting with filtered photos and promotional descriptions. Prioritize verified host properties where direct contact and transparent room specifications are guaranteed. Check recent guest reviews regarding bedding comfort, bathroom hygiene, and acoustic privacy.",
      featuredImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      category: "Travel Tips",
      author: "Pooja Malhotra",
      authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
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
      content: "The Himalayas in North India beckon travelers with quiet pine forests, snow-clad mountain passes, and cozy cedarwood cottages. For an authentic stay, reserve verified mountain villas with fireplaces and heated rooms, and arrange local transfers well before dusk.",
      featuredImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      category: "Destination Guide",
      author: "Rohan Varma",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
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
      content: "Rajasthan's regal legacy is best experienced within living palaces and boutique havelis. Savor authentic Mewari dishes prepared by royal chefs, stroll through mirrored courtyards, and discover the history behind hand-painted frescoes.",
      featuredImage: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
      category: "Heritage",
      author: "Ananya Roy",
      authorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
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
    blogsCache = Array.isArray(parsed) ? parsed : [];
    return blogsCache;
  } catch (error) {
    console.error("Backend Blog Storage Error:", error);
    blogsCache = [];
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
  const blogs = getAllBlogs();
  return blogs.find((b) => b.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export function createBlog(data: Omit<BlogPostRecord, "id" | "createdAt" | "updatedAt">): BlogPostRecord {
  const blogs = getAllBlogs();
  const slug = data.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const existingSlug = blogs.find((b) => b.slug === slug);
  if (existingSlug) {
    throw new Error(`A blog with slug "${slug}" already exists.`);
  }

  const now = new Date().toISOString();
  const newBlog: BlogPostRecord = {
    id: `blog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...data,
    slug,
    createdAt: now,
    updatedAt: now,
    publishedAt: data.status === "published" ? data.publishedAt || now : undefined,
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

  const now = new Date().toISOString();
  const updated: BlogPostRecord = {
    ...blogs[index],
    ...updates,
    updatedAt: now,
    publishedAt:
      updates.status === "published" && !blogs[index].publishedAt
        ? now
        : updates.publishedAt || blogs[index].publishedAt,
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

/** Returns only published blog posts */
export function getPublishedBlogs() {
  return getAllBlogs().filter((b) => b.status === "published");
}
