import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MemoryRecord, MemoryInput, MemoryStatus, MemorySource } from "../../types/memory";
import { connectToDatabase } from "../db/mongodb";
import { MemoryModel } from "../models/Memory";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "memories.json");

let memoryCache: MemoryRecord[] | null = null;

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function clearMemoryCache(): void {
  memoryCache = null;
}

export function getAllMemories(forceRefresh = false): MemoryRecord[] {
  if (!forceRefresh && memoryCache !== null) {
    return memoryCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    memoryCache = Array.isArray(parsed) ? parsed : [];
    // Sort by displayOrder ascending, then newest
    memoryCache.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    return memoryCache;
  } catch (error) {
    console.error("Backend Memory Storage Error: Failed to read memories store:", error);
    memoryCache = [];
    return memoryCache;
  }
}

export function saveMemories(memories: MemoryRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(memories, null, 2);

    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);

    memoryCache = memories;

    // Asynchronously synchronize with MongoDB
    connectToDatabase()
      .then(async () => {
        try {
          // Bulk upsert to MongoDB
          const operations = memories.map((mem) => ({
            updateOne: {
              filter: { id: mem.id },
              update: { $set: mem },
              upsert: true,
            },
          }));
          if (operations.length > 0) {
            await MemoryModel.bulkWrite(operations);
          }
        } catch (dbErr) {
          console.warn("MongoDB Memory Sync non-critical warning:", dbErr);
        }
      })
      .catch((err) => {
        // Non-blocking fallback to JSON store
        console.warn("MongoDB connection warning in Memory sync:", err);
      });
  } catch (error) {
    console.error("Backend Memory Storage Error: Failed to save memories:", error);
    throw new Error("Failed to write to memories storage.");
  }
}

export function getMemoryById(id: string): MemoryRecord | null {
  const memories = getAllMemories();
  return memories.find((m) => m.id === id) || null;
}

export function getPublicMemories(): Omit<MemoryRecord, "guestEmail">[] {
  const memories = getAllMemories();
  return memories
    .filter((m) => m.isPublished && m.isActive && m.status === "approved")
    .map((m) => {
      // Strip private guest email
      const { guestEmail, ...publicData } = m;
      return publicData;
    });
}

export function createMemory(input: MemoryInput): MemoryRecord {
  const memories = getAllMemories();
  const now = new Date().toISOString();
  const id = `mem_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const formattedImages = (input.images || []).map((img, idx) => {
    if (typeof img === "string") {
      return {
        id: `img_${Date.now()}_${idx}`,
        url: img.trim(),
        isCover: idx === 0,
      };
    }
    return {
      id: img.id || `img_${Date.now()}_${idx}`,
      url: img.url.trim(),
      caption: img.caption?.trim(),
      isCover: img.isCover ?? idx === 0,
    };
  });

  const cover =
    input.coverImage ||
    formattedImages.find((img) => img.isCover)?.url ||
    formattedImages[0]?.url ||
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85";

  const newRecord: MemoryRecord = {
    id,
    guestName: input.guestName.trim(),
    guestEmail: input.guestEmail?.trim(),
    profileImage: input.profileImage?.trim(),
    title: input.title.trim(),
    shortDescription: input.shortDescription.trim(),
    story: input.story.trim(),
    countryId: input.countryId,
    stateId: input.stateId,
    cityId: input.cityId,
    areaId: input.areaId,
    destinationName: input.destinationName.trim(),
    propertyId: input.propertyId,
    propertyName: input.propertyName?.trim(),
    travelDate: input.travelDate?.trim(),
    images: formattedImages,
    coverImage: cover,
    source: input.source || "admin_created",
    status: input.status || (input.source === "guest_submitted" ? "pending" : "approved"),
    isPublished: input.isPublished !== undefined ? input.isPublished : input.source !== "guest_submitted",
    isActive: input.isActive !== undefined ? input.isActive : true,
    displayOrder: input.displayOrder !== undefined ? input.displayOrder : memories.length + 1,
    isDemo: Boolean(input.isDemo),
    createdAt: now,
    updatedAt: now,
  };

  memories.push(newRecord);
  saveMemories(memories);
  return newRecord;
}

export function updateMemory(id: string, updates: Partial<MemoryInput>): MemoryRecord | null {
  const memories = getAllMemories();
  const index = memories.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const current = memories[index];
  const now = new Date().toISOString();

  let formattedImages = current.images;
  if (updates.images) {
    formattedImages = updates.images.map((img, idx) => {
      if (typeof img === "string") {
        return {
          id: `img_${Date.now()}_${idx}`,
          url: img.trim(),
          isCover: idx === 0,
        };
      }
      return {
        id: img.id || `img_${Date.now()}_${idx}`,
        url: img.url.trim(),
        caption: img.caption?.trim(),
        isCover: img.isCover ?? idx === 0,
      };
    });
  }

  const updatedRecord: MemoryRecord = {
    ...current,
    guestName: updates.guestName !== undefined ? updates.guestName.trim() : current.guestName,
    guestEmail: updates.guestEmail !== undefined ? updates.guestEmail.trim() : current.guestEmail,
    profileImage: updates.profileImage !== undefined ? updates.profileImage.trim() : current.profileImage,
    title: updates.title !== undefined ? updates.title.trim() : current.title,
    shortDescription: updates.shortDescription !== undefined ? updates.shortDescription.trim() : current.shortDescription,
    story: updates.story !== undefined ? updates.story.trim() : current.story,
    destinationName: updates.destinationName !== undefined ? updates.destinationName.trim() : current.destinationName,
    countryId: updates.countryId !== undefined ? updates.countryId : current.countryId,
    stateId: updates.stateId !== undefined ? updates.stateId : current.stateId,
    cityId: updates.cityId !== undefined ? updates.cityId : current.cityId,
    areaId: updates.areaId !== undefined ? updates.areaId : current.areaId,
    propertyId: updates.propertyId !== undefined ? updates.propertyId : current.propertyId,
    propertyName: updates.propertyName !== undefined ? updates.propertyName.trim() : current.propertyName,
    travelDate: updates.travelDate !== undefined ? updates.travelDate.trim() : current.travelDate,
    images: formattedImages,
    coverImage: updates.coverImage !== undefined ? updates.coverImage : (formattedImages[0]?.url || current.coverImage),
    status: updates.status !== undefined ? updates.status : current.status,
    isPublished: updates.isPublished !== undefined ? updates.isPublished : current.isPublished,
    isActive: updates.isActive !== undefined ? updates.isActive : current.isActive,
    displayOrder: updates.displayOrder !== undefined ? updates.displayOrder : current.displayOrder,
    rejectionReason: updates.status === "rejected" ? updates.rejectionReason || current.rejectionReason : undefined,
    updatedAt: now,
  };

  memories[index] = updatedRecord;
  saveMemories(memories);
  return updatedRecord;
}

export function deleteMemory(id: string): boolean {
  const memories = getAllMemories();
  const next = memories.filter((m) => m.id !== id);
  if (next.length === memories.length) return false;

  saveMemories(next);

  // MongoDB deletion sync
  connectToDatabase().then(async () => {
    try {
      await MemoryModel.deleteOne({ id });
    } catch (e) {
      console.warn("MongoDB memory delete warning:", e);
    }
  }).catch(() => {});

  return true;
}

export function reorderMemories(orderedIds: string[]): MemoryRecord[] {
  const memories = getAllMemories();
  const map = new Map(memories.map((m) => [m.id, m]));

  const reordered: MemoryRecord[] = [];
  orderedIds.forEach((id, idx) => {
    const mem = map.get(id);
    if (mem) {
      mem.displayOrder = idx + 1;
      mem.updatedAt = new Date().toISOString();
      reordered.push(mem);
      map.delete(id);
    }
  });

  // Append any remainder
  map.forEach((mem) => {
    mem.displayOrder = reordered.length + 1;
    reordered.push(mem);
  });

  saveMemories(reordered);
  return reordered;
}

/**
 * Safely cleans up demo records (isDemo: true) without touching any genuine guest submissions.
 */
export function clearDemoMemories(): number {
  const memories = getAllMemories();
  const nonDemo = memories.filter((m) => !m.isDemo);
  const deletedCount = memories.length - nonDemo.length;

  saveMemories(nonDemo);

  connectToDatabase().then(async () => {
    try {
      await MemoryModel.deleteMany({ isDemo: true });
    } catch (e) {
      console.warn("MongoDB clear demo warning:", e);
    }
  }).catch(() => {});

  return deletedCount;
}
