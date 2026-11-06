import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DestinationHeroImage } from "../../types/admin";
import { connectToDatabase } from "../db/mongodb";
import { DestinationHeroImageModel } from "../models/DestinationHeroImage";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "destinationHeroImages.json");

let heroImagesCache: DestinationHeroImage[] | null = null;

// Initial curated test collections matching Requirement 6
function getInitialHeroImages(): DestinationHeroImage[] {
  const now = new Date().toISOString();

  return [
    // ── India Test Collection (Country-Level) ──
    {
      id: "dhi_in_1",
      destinationType: "country",
      countryId: "cnt_in",
      title: "Taj Mahal, Agra",
      locationName: "Agra, Uttar Pradesh",
      imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2400&q=85",
      altText: "Majestic marble architecture of Taj Mahal at sunrise reflecting in tranquil pool",
      order: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_in_2",
      destinationType: "country",
      countryId: "cnt_in",
      title: "Hawa Mahal, Jaipur",
      locationName: "Jaipur, Rajasthan",
      imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=2400&q=85",
      altText: "Intricate pink sandstone facade of Hawa Mahal in the royal city of Jaipur",
      order: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_in_3",
      destinationType: "country",
      countryId: "cnt_in",
      title: "Kerala Backwaters",
      locationName: "Alleppey, Kerala",
      imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2400&q=85",
      altText: "Traditional luxury houseboat cruising serene emerald waterways of Kerala backwaters",
      order: 3,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_in_4",
      destinationType: "country",
      countryId: "cnt_in",
      title: "Goa Beaches",
      locationName: "South Goa, Goa",
      imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2400&q=85",
      altText: "Golden sunset over pristine tropical palm-fringed coast of Goa",
      order: 4,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_in_5",
      destinationType: "country",
      countryId: "cnt_in",
      title: "Pangong Lake, Ladakh",
      locationName: "Ladakh, India",
      imageUrl: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=2400&q=85",
      altText: "Crystal turquoise high-altitude Pangong Lake framed by rugged Himalayan peaks",
      order: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // ── Uttarakhand Test Collection (State-Level) ──
    {
      id: "dhi_uk_1",
      destinationType: "state",
      countryId: "cnt_in",
      stateId: "st_uk",
      title: "Mussoorie",
      locationName: "Queen of the Hills, Uttarakhand",
      imageUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2400&q=85",
      altText: "Misty pine-clad Himalayan ridges of Mussoorie overlooking the Doon valley",
      order: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_uk_2",
      destinationType: "state",
      countryId: "cnt_in",
      stateId: "st_uk",
      title: "Nainital",
      locationName: "Kumaon Lake District, Uttarakhand",
      imageUrl: "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=2400&q=85",
      altText: "Scenic emerald crescent Naini Lake surrounded by lush forested hill slopes",
      order: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_uk_3",
      destinationType: "state",
      countryId: "cnt_in",
      stateId: "st_uk",
      title: "Auli",
      locationName: "Chamoli, Uttarakhand",
      imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2400&q=85",
      altText: "Snow-dusted alpine meadows and Himalayan ski slopes of Auli facing Nanda Devi",
      order: 3,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_uk_4",
      destinationType: "state",
      countryId: "cnt_in",
      stateId: "st_uk",
      title: "Rishikesh",
      locationName: "Ganga Valley, Uttarakhand",
      imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=2400&q=85",
      altText: "Spiritual twilight Aarti on the sacred banks of the Ganges river in Rishikesh",
      order: 4,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "dhi_uk_5",
      destinationType: "state",
      countryId: "cnt_in",
      stateId: "st_uk",
      title: "Valley of Flowers",
      locationName: "Chamoli Biosphere, Uttarakhand",
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=85",
      altText: "Vibrant alpine wildflower blossoms carpeting high altitude Himalayan glacial valley",
      order: 5,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialHeroImages();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

function persistToFile(images: DestinationHeroImage[]): void {
  try {
    ensureDataFile();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(images, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    heroImagesCache = images;
  } catch (err) {
    console.error("Failed to persist destination hero images to file:", err);
  }
}

async function syncToMongoAsync(image: DestinationHeroImage): Promise<void> {
  try {
    await connectToDatabase();
    await DestinationHeroImageModel.findOneAndUpdate(
      { id: image.id },
      { ...image },
      { upsert: true, new: true }
    );
  } catch {
    // Graceful offline fallback
  }
}

async function deleteFromMongoAsync(id: string): Promise<void> {
  try {
    await connectToDatabase();
    await DestinationHeroImageModel.deleteOne({ id });
  } catch {
    // Graceful offline fallback
  }
}

export function getAllDestinationHeroImages(): DestinationHeroImage[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      heroImagesCache = parsed;
      return parsed;
    }
  } catch {
    // fallback
  }
  const fallback = getInitialHeroImages();
  heroImagesCache = fallback;
  return fallback;
}

export interface GetDestinationHeroImagesFilter {
  countryId?: string;
  stateId?: string;
  onlyActive?: boolean;
}

/**
 * Returns matching destination hero images following the strict priority rule:
 * 1. If stateId is provided, fetch images assigned to that state.
 * 2. If countryId is provided (without stateId), fetch country-level images.
 * 3. State images take priority over country-level images when a state is selected.
 */
export function getDestinationHeroImages(filter: GetDestinationHeroImagesFilter): DestinationHeroImage[] {
  const all = getAllDestinationHeroImages();

  if (filter.stateId) {
    // Case B: State selection
    let stateImages = all.filter(
      (img) =>
        img.destinationType === "state" &&
        img.stateId?.toLowerCase() === filter.stateId?.toLowerCase() &&
        (!filter.onlyActive || img.isActive)
    );

    stateImages.sort((a, b) => a.order - b.order);

    if (stateImages.length > 0) {
      return stateImages;
    }

    // If state has no images, optionally fall back to its parent country's images if countryId exists
    if (filter.countryId) {
      const countryImages = all.filter(
        (img) =>
          img.destinationType === "country" &&
          img.countryId.toLowerCase() === filter.countryId?.toLowerCase() &&
          (!filter.onlyActive || img.isActive)
      );
      countryImages.sort((a, b) => a.order - b.order);
      return countryImages;
    }

    return [];
  }

  if (filter.countryId) {
    // Case A: Country selection (no state)
    const countryImages = all.filter(
      (img) =>
        img.destinationType === "country" &&
        img.countryId.toLowerCase() === filter.countryId?.toLowerCase() &&
        (!filter.onlyActive || img.isActive)
    );
    countryImages.sort((a, b) => a.order - b.order);
    return countryImages;
  }

  return [];
}

export function getDestinationHeroImageById(id: string): DestinationHeroImage | null {
  const all = getAllDestinationHeroImages();
  return all.find((img) => img.id === id) || null;
}

export function createDestinationHeroImage(
  data: Omit<DestinationHeroImage, "id" | "createdAt" | "updatedAt">
): DestinationHeroImage {
  const all = getAllDestinationHeroImages();
  const now = new Date().toISOString();
  const id = `dhi_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  // Compute next order if not specified
  const sameDestinationImages = all.filter(
    (img) =>
      img.destinationType === data.destinationType &&
      img.countryId === data.countryId &&
      (data.destinationType === "country" || img.stateId === data.stateId)
  );
  const nextOrder = data.order || sameDestinationImages.length + 1;

  const newRecord: DestinationHeroImage = {
    ...data,
    id,
    order: nextOrder,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: now,
    updatedAt: now,
  };

  all.push(newRecord);
  persistToFile(all);
  syncToMongoAsync(newRecord).catch(() => {});
  return newRecord;
}

export function updateDestinationHeroImage(
  id: string,
  updates: Partial<Omit<DestinationHeroImage, "id" | "createdAt">>
): DestinationHeroImage | null {
  const all = getAllDestinationHeroImages();
  const index = all.findIndex((img) => img.id === id);
  if (index === -1) return null;

  const updated: DestinationHeroImage = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  persistToFile(all);
  syncToMongoAsync(updated).catch(() => {});
  return updated;
}

export function deleteDestinationHeroImage(id: string): boolean {
  const all = getAllDestinationHeroImages();
  const index = all.findIndex((img) => img.id === id);
  if (index === -1) return false;

  all.splice(index, 1);
  persistToFile(all);
  deleteFromMongoAsync(id).catch(() => {});
  return true;
}

export function reorderDestinationHeroImages(orderedIds: string[]): DestinationHeroImage[] {
  const all = getAllDestinationHeroImages();
  const idToOrder = new Map<string, number>();
  orderedIds.forEach((id, idx) => idToOrder.set(id, idx + 1));

  const updated = all.map((img) => {
    if (idToOrder.has(img.id)) {
      return {
        ...img,
        order: idToOrder.get(img.id)!,
        updatedAt: new Date().toISOString(),
      };
    }
    return img;
  });

  persistToFile(updated);
  updated.forEach((img) => syncToMongoAsync(img).catch(() => {}));
  return updated;
}
