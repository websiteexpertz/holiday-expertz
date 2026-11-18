import fs from "fs";
import path from "path";
import connectToDatabase from "../db/mongodb";
import { CounterModel } from "../models/Counter";
import { PropertyModel } from "../models/Property";
import { PropertyOwnerModel } from "../models/PropertyOwner";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const COUNTER_FILE = path.join(rootDir, "backend", "src", "data", "counters.json");

export function formatPropertyNumber(seq: number): string {
  if (seq <= 0) return "HE-000001";
  return `HE-${String(seq).padStart(6, "0")}`;
}

export function parsePropertyNumber(propertyNumber?: string | null): number | null {
  if (!propertyNumber || typeof propertyNumber !== "string") return null;
  const match = propertyNumber.trim().match(/^HE-(\d+)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

export function formatOwnerNumber(seq: number): string {
  if (seq <= 0) return "HE-OWN-000001";
  return `HE-OWN-${String(seq).padStart(6, "0")}`;
}

export function parseOwnerNumber(ownerNumber?: string | null): number | null {
  if (!ownerNumber || typeof ownerNumber !== "string") return null;
  const match = ownerNumber.trim().match(/^HE-OWN-(\d+)$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  return isNaN(num) ? null : num;
}

function readLocalCounterFile(): Record<string, number> {
  try {
    if (fs.existsSync(COUNTER_FILE)) {
      const raw = fs.readFileSync(COUNTER_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Failed to read local counter file:", err);
  }
  return {};
}

function writeLocalCounterFile(data: Record<string, number>): void {
  try {
    const dir = path.dirname(COUNTER_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${COUNTER_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, COUNTER_FILE);
  } catch (err) {
    console.warn("Failed to write local counter file:", err);
  }
}

/**
 * Atomically generates the next unique Property Number in format HE-000001
 * Uses MongoDB atomic $inc on CounterModel when available, with atomic file fallback.
 */
export async function getNextPropertyNumber(): Promise<string> {
  try {
    await connectToDatabase();
    const counterDoc = await CounterModel.findOneAndUpdate(
      { _id: "propertyNumber" },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const seq = counterDoc.sequence;
    const localCounters = readLocalCounterFile();
    localCounters.propertyNumber = Math.max(localCounters.propertyNumber || 0, seq);
    writeLocalCounterFile(localCounters);

    return formatPropertyNumber(seq);
  } catch (mongoErr) {
    console.warn("MongoDB atomic counter unavailable, utilizing resilient fallback:", (mongoErr as Error)?.message);
    const localCounters = readLocalCounterFile();
    const current = localCounters.propertyNumber || 0;
    const next = current + 1;
    localCounters.propertyNumber = next;
    writeLocalCounterFile(localCounters);

    return formatPropertyNumber(next);
  }
}

/**
 * Synchronizes the sequence counter with the highest assigned Property Number in the database
 */
export async function syncCounterWithHighestNumber(explicitMax?: number): Promise<number> {
  let highest = explicitMax || 0;

  try {
    await connectToDatabase();
    if (!highest) {
      const properties = await PropertyModel.find(
        { propertyNumber: { $exists: true, $ne: null } },
        { propertyNumber: 1 }
      ).lean();

      for (const p of properties) {
        const num = parsePropertyNumber(p.propertyNumber);
        if (num && num > highest) {
          highest = num;
        }
      }
    }

    if (highest > 0) {
      await CounterModel.findOneAndUpdate(
        { _id: "propertyNumber" },
        { $max: { sequence: highest } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("Failed to sync counter with MongoDB:", err);
  }

  const localCounters = readLocalCounterFile();
  localCounters.propertyNumber = Math.max(localCounters.propertyNumber || 0, highest);
  writeLocalCounterFile(localCounters);

  return highest;
}

/**
 * Atomically generates the next unique Owner Number in format HE-OWN-000001
 * Uses MongoDB atomic $inc on CounterModel when available, with atomic file fallback.
 * Strictly isolated from propertyNumber sequence.
 */
export async function getNextOwnerNumber(): Promise<string> {
  try {
    await connectToDatabase();
    const counterDoc = await CounterModel.findOneAndUpdate(
      { _id: "ownerNumber" },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const seq = counterDoc.sequence;
    const localCounters = readLocalCounterFile();
    localCounters.ownerNumber = Math.max(localCounters.ownerNumber || 0, seq);
    writeLocalCounterFile(localCounters);

    return formatOwnerNumber(seq);
  } catch (mongoErr) {
    console.warn("MongoDB atomic owner counter unavailable, utilizing resilient fallback:", (mongoErr as Error)?.message);
    const localCounters = readLocalCounterFile();
    const current = localCounters.ownerNumber || 0;
    const next = current + 1;
    localCounters.ownerNumber = next;
    writeLocalCounterFile(localCounters);

    return formatOwnerNumber(next);
  }
}

/**
 * Synchronizes the owner sequence counter with the highest assigned Owner Number in the database
 */
export async function syncOwnerCounterWithHighestNumber(explicitMax?: number): Promise<number> {
  let highest = explicitMax || 0;

  try {
    await connectToDatabase();
    if (!highest) {
      const owners = await PropertyOwnerModel.find(
        { ownerNumber: { $exists: true, $ne: null } },
        { ownerNumber: 1 }
      ).lean();

      for (const o of owners) {
        const num = parseOwnerNumber(o.ownerNumber);
        if (num && num > highest) {
          highest = num;
        }
      }
    }

    if (highest > 0) {
      await CounterModel.findOneAndUpdate(
        { _id: "ownerNumber" },
        { $max: { sequence: highest } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn("Failed to sync owner counter with MongoDB:", err);
  }

  const localCounters = readLocalCounterFile();
  localCounters.ownerNumber = Math.max(localCounters.ownerNumber || 0, highest);
  writeLocalCounterFile(localCounters);

  return highest;
}
