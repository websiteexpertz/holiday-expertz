import fs from "fs";
import path from "path";
import { ReviewRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "reviews.json");

let reviewsCache: ReviewRecord[] | null = null;

const SEED_REVIEWS: ReviewRecord[] = [
  {
    id: "rev-301",
    author: "Ananya Iyer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Our family stay in Udaipur was beyond magical. The palace grounds, sunrise boat tour on Lake Pichola, and the attentive staff made our 10th anniversary unforgettable!",
    propertyName: "Singhania Heritage Palace & Spa",
    propertyId: "prop_1792595900000_a1b2c3d4",
    location: "Udaipur, Rajasthan",
    status: "approved",
    featured: true,
    createdAt: "2026-10-15T09:40:00.000Z",
  },
  {
    id: "rev-302",
    author: "Kabir Mehta",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "Booking through HolidayExpertz was totally seamless. Found an exclusive luxury villa with a private chef in South Goa at 20% lower rate than other portals.",
    propertyName: "Taj Exotica Resort & Spa",
    propertyId: "h-2",
    location: "South Goa",
    status: "approved",
    featured: true,
    createdAt: "2026-10-12T14:15:00.000Z",
  },
  {
    id: "rev-303",
    author: "Siddharth & Natasha Roy",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    rating: 5,
    comment: "The Himalayan views from the private cedar balcony took our breath away. Morning tea amidst deodar pines is pure therapy. Outstanding property curation!",
    propertyName: "Wildflower Hall, An Oberoi Resort",
    propertyId: "h-3",
    location: "Shimla, Himachal Pradesh",
    status: "approved",
    featured: true,
    createdAt: "2026-10-08T11:25:00.000Z",
  },
  {
    id: "rev-304",
    author: "Meera Deshmukh",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
    rating: 4,
    comment: "Good amenities and clean rooms. Check-in was delayed by 20 minutes due to peak holiday rush, but the complimentary dinner buffet compensated nicely.",
    propertyName: "Singhania Heritage Palace & Spa",
    propertyId: "prop_1792595900000_a1b2c3d4",
    location: "Udaipur, Rajasthan",
    status: "pending",
    featured: false,
    createdAt: "2026-10-21T08:10:00.000Z",
  },
];

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_REVIEWS, null, 2), "utf-8");
  }
}

export function getAllReviews(): ReviewRecord[] {
  if (reviewsCache !== null) {
    return reviewsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    reviewsCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_REVIEWS;
    return reviewsCache;
  } catch (error) {
    console.error("Backend Review Storage Error:", error);
    reviewsCache = SEED_REVIEWS;
    return reviewsCache;
  }
}

export function saveReviews(reviews: ReviewRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(reviews, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    reviewsCache = reviews;
  } catch (error) {
    console.error("Failed to persist reviews:", error);
    throw new Error("Failed to persist reviews to storage.");
  }
}

export function getReviewById(id: string): ReviewRecord | undefined {
  return getAllReviews().find((r) => r.id === id);
}

export function createReview(input: Omit<ReviewRecord, "id" | "createdAt">): ReviewRecord {
  const reviews = getAllReviews();
  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: ReviewRecord = {
    ...input,
    id,
    createdAt: now,
  };

  reviews.unshift(record);
  saveReviews(reviews);
  return record;
}

export function updateReview(id: string, updates: Partial<ReviewRecord>): ReviewRecord | null {
  const reviews = getAllReviews();
  const index = reviews.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const current = reviews[index];
  const updated: ReviewRecord = {
    ...current,
    ...updates,
    id: current.id,
  };

  reviews[index] = updated;
  saveReviews(reviews);
  return updated;
}

export function deleteReview(id: string): boolean {
  const reviews = getAllReviews();
  const index = reviews.findIndex((r) => r.id === id);
  if (index === -1) return false;

  reviews.splice(index, 1);
  saveReviews(reviews);
  return true;
}

export function getApprovedPublicReviews(): ReviewRecord[] {
  return getAllReviews().filter((r) => r.status === "approved");
}
