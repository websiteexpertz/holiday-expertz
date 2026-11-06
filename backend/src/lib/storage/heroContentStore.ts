import fs from "fs";
import path from "path";
import { HeroBannerContentRecord, HeroBannerContentSlot } from "../../types/admin";
import { connectToDatabase } from "../db/mongodb";
import { HeroBannerContentModel } from "../models/HeroBannerContent";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "heroBannerContent.json");

export const DEFAULT_HERO_SLOTS: HeroBannerContentSlot[] = [
  {
    slotIndex: 0,
    slideNumber: 1,
    heading: "Small places. Big memories.",
    description: "Design-led stays with character.",
    updatedAt: "2026-11-05T00:00:00.000Z",
  },
  {
    slotIndex: 1,
    slideNumber: 2,
    heading: "Great stays. Smart prices.",
    description: "Clean, comfortable and easy on the wallet.",
    updatedAt: "2026-11-05T00:00:00.000Z",
  },
  {
    slotIndex: 2,
    slideNumber: 3,
    heading: "Stay local. Feel at home.",
    description: "Warm hosts, home-cooked meals, real stories.",
    updatedAt: "2026-11-05T00:00:00.000Z",
  },
  {
    slotIndex: 3,
    slideNumber: 4,
    heading: "Unwind. Recharge. Repeat.",
    description: "Beach and hill resorts made for slow days.",
    updatedAt: "2026-11-05T00:00:00.000Z",
  },
];

let heroContentCache: HeroBannerContentRecord | null = null;

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initial: HeroBannerContentRecord = {
      slots: DEFAULT_HERO_SLOTS,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
  }
}

export function getHeroBannerContent(): HeroBannerContentRecord {
  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    // Validate that slots array exists and has exactly 4 slots
    if (parsed && Array.isArray(parsed.slots) && parsed.slots.length >= 4) {
      // Ensure sorted by slideNumber / slotIndex
      parsed.slots.sort((a: HeroBannerContentSlot, b: HeroBannerContentSlot) => a.slideNumber - b.slideNumber);
      heroContentCache = parsed as HeroBannerContentRecord;
      return heroContentCache;
    }

    // If incomplete, fill missing from defaults
    const slotsMap = new Map<number, HeroBannerContentSlot>();
    DEFAULT_HERO_SLOTS.forEach((s) => slotsMap.set(s.slideNumber, { ...s }));

    if (parsed && Array.isArray(parsed.slots)) {
      parsed.slots.forEach((s: HeroBannerContentSlot) => {
        if (s.slideNumber >= 1 && s.slideNumber <= 4) {
          slotsMap.set(s.slideNumber, s);
        }
      });
    }

    const mergedSlots = Array.from(slotsMap.values()).sort((a, b) => a.slideNumber - b.slideNumber);
    const validated: HeroBannerContentRecord = {
      slots: mergedSlots,
      updatedAt: parsed?.updatedAt || new Date().toISOString(),
    };

    saveHeroBannerContent(validated);
    heroContentCache = validated;
    return validated;
  } catch (error) {
    console.error("Backend Hero Banner Content Storage Error:", error);
    return {
      slots: DEFAULT_HERO_SLOTS,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function saveHeroBannerContent(record: HeroBannerContentRecord): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(record, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    heroContentCache = record;

    // Asynchronously sync to MongoDB if configured
    syncToMongo(record).catch((err) => {
      // Non-blocking log if MongoDB is not active
    });
  } catch (error) {
    console.error("Failed to persist hero banner content:", error);
    throw new Error("Failed to persist hero banner content to storage.");
  }
}

async function syncToMongo(record: HeroBannerContentRecord) {
  try {
    await connectToDatabase();
    for (const slot of record.slots) {
      await HeroBannerContentModel.findOneAndUpdate(
        { slotIndex: slot.slotIndex },
        {
          slotIndex: slot.slotIndex,
          slideNumber: slot.slideNumber,
          heading: slot.heading,
          description: slot.description,
          updatedAt: slot.updatedAt,
        },
        { upsert: true, new: true }
      );
    }
  } catch {
    // Ignore if MongoDB is not running locally
  }
}

export function updateHeroBannerContentSlot(
  slideNumber: number,
  data: { heading: string; description: string }
): HeroBannerContentRecord {
  if (slideNumber < 1 || slideNumber > 4) {
    throw new Error(`Invalid slideNumber ${slideNumber}. Must be between 1 and 4.`);
  }

  const cleanHeading = data.heading.trim();
  const cleanDescription = data.description.trim();

  if (!cleanHeading) {
    throw new Error(`Heading cannot be empty for Slide ${slideNumber}.`);
  }
  if (!cleanDescription) {
    throw new Error(`Description cannot be empty for Slide ${slideNumber}.`);
  }

  const current = getHeroBannerContent();
  const now = new Date().toISOString();

  const nextSlots = current.slots.map((slot) => {
    if (slot.slideNumber === slideNumber) {
      return {
        ...slot,
        heading: cleanHeading,
        description: cleanDescription,
        updatedAt: now,
      };
    }
    return slot;
  });

  const updatedRecord: HeroBannerContentRecord = {
    slots: nextSlots,
    updatedAt: now,
  };

  saveHeroBannerContent(updatedRecord);
  return updatedRecord;
}

export function updateAllHeroBannerContentSlots(
  slotsInput: Array<{ slideNumber: number; heading: string; description: string }>
): HeroBannerContentRecord {
  if (!Array.isArray(slotsInput) || slotsInput.length === 0) {
    throw new Error("Invalid slots payload.");
  }

  const current = getHeroBannerContent();
  const now = new Date().toISOString();
  const slotsMap = new Map<number, HeroBannerContentSlot>();
  current.slots.forEach((s) => slotsMap.set(s.slideNumber, { ...s }));

  for (const item of slotsInput) {
    if (item.slideNumber < 1 || item.slideNumber > 4) continue;
    const h = item.heading?.trim();
    const d = item.description?.trim();
    if (!h) {
      throw new Error(`Heading cannot be empty for Slide ${item.slideNumber}.`);
    }
    if (!d) {
      throw new Error(`Description cannot be empty for Slide ${item.slideNumber}.`);
    }

    const existing = slotsMap.get(item.slideNumber);
    if (existing) {
      slotsMap.set(item.slideNumber, {
        ...existing,
        heading: h,
        description: d,
        updatedAt: now,
      });
    }
  }

  const nextSlots = Array.from(slotsMap.values()).sort((a, b) => a.slideNumber - b.slideNumber);
  const updatedRecord: HeroBannerContentRecord = {
    slots: nextSlots,
    updatedAt: now,
  };

  saveHeroBannerContent(updatedRecord);
  return updatedRecord;
}
