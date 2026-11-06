import fs from "fs";
import path from "path";
import { Property, PropertyDashboardStats, PropertyStatus } from "../../types/property";
import { connectToDatabase } from "../db/mongodb";
import { PropertyModel } from "../models/Property";

// Path resolution: locate backend/src/data/properties.json from either root or frontend cwd
const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "properties.json");

let propertiesCache: Property[] | null = null;

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function clearPropertiesCache(): void {
  propertiesCache = null;
}

export function getAllProperties(forceRefresh = false): Property[] {
  if (!forceRefresh && propertiesCache !== null) {
    return propertiesCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    propertiesCache = Array.isArray(parsed) ? parsed : [];
    return propertiesCache;
  } catch (error) {
    console.error("Backend Property Storage Error: Failed to read properties store:", error);
    propertiesCache = [];
    return propertiesCache;
  }
}

export function saveProperties(properties: Property[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(properties, null, 2);

    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);

    propertiesCache = properties;

    // Asynchronously synchronize with MongoDB
    connectToDatabase()
      .then(async () => {
        for (const p of properties) {
          await PropertyModel.findOneAndUpdate({ id: p.id }, p, { upsert: true });
        }
      })
      .catch((err) => {
        console.error("MongoDB background property sync error:", err);
      });
  } catch (error) {
    console.error("Backend Property Storage Error: Failed to persist properties:", error);
    throw new Error("Failed to persist property record to storage.");
  }
}

export function getPropertiesByOwnerId(ownerId: string): Property[] {
  const properties = getAllProperties();
  return properties.filter((p) => p.ownerId === ownerId);
}

export function getPropertyById(id: string): Property | undefined {
  const properties = getAllProperties();
  return properties.find((p) => p.id === id);
}

export function createPropertyRecord(newProperty: Property): Property {
  const properties = getAllProperties();
  properties.unshift(newProperty);
  saveProperties(properties);
  return newProperty;
}

export function updatePropertyRecord(id: string, updates: Partial<Property>): Property | null {
  const properties = getAllProperties();
  const index = properties.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = properties[index];
  const updated: Property = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  properties[index] = updated;
  saveProperties(properties);
  return updated;
}

export function deletePropertyRecord(id: string): boolean {
  const properties = getAllProperties();
  const index = properties.findIndex((p) => p.id === id);
  if (index === -1) return false;

  properties.splice(index, 1);
  saveProperties(properties);
  connectToDatabase().then(() => PropertyModel.deleteOne({ id })).catch(() => {});
  return true;
}

export function getOwnerDashboardStats(ownerId: string): PropertyDashboardStats {
  const ownerProperties = getPropertiesByOwnerId(ownerId);
  const stats: PropertyDashboardStats = {
    total: ownerProperties.length,
    published: 0,
    pendingApproval: 0,
    rejected: 0,
    draft: 0,
  };

  for (const prop of ownerProperties) {
    if (prop.status === "approved") stats.published += 1;
    else if (prop.status === "pending_approval") stats.pendingApproval += 1;
    else if (prop.status === "rejected") stats.rejected += 1;
    else if (prop.status === "draft") stats.draft += 1;
  }

  return stats;
}

export function getPublicApprovedProperties(): Property[] {
  const properties = getAllProperties();
  return properties.filter((p) => p.status === "approved");
}

export function approvePropertyRecord(id: string): Property | null {
  return updatePropertyRecord(id, {
    status: "approved",
    approvedAt: new Date().toISOString(),
    rejectionReason: undefined,
  });
}

export function rejectPropertyRecord(id: string, reason: string): Property | null {
  return updatePropertyRecord(id, {
    status: "rejected",
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason.trim(),
  });
}

export function togglePropertyPauseRecord(id: string): Property | null {
  const prop = getPropertyById(id);
  if (!prop) return null;
  const newStatus = prop.status === "paused" ? "approved" : "paused";
  return updatePropertyRecord(id, {
    status: newStatus,
  });
}

export function togglePropertyFeaturedRecord(id: string): Property | null {
  const prop = getPropertyById(id);
  if (!prop) return null;
  return updatePropertyRecord(id, {
    featured: !prop.featured,
  });
}

export function togglePropertyHandpickedRecord(id: string): Property | null {
  const prop = getPropertyById(id);
  if (!prop) return null;
  return updatePropertyRecord(id, {
    handpicked: !prop.handpicked,
  });
}

export function updatePropertyLocationHierarchy(
  id: string,
  hierarchy: {
    countryId?: string;
    stateId?: string;
    cityId?: string;
    areaId?: string;
    country?: string;
    state?: string;
    city?: string;
    locality?: string;
  }
): Property | null {
  const prop = getPropertyById(id);
  if (!prop) return null;

  return updatePropertyRecord(id, {
    countryId: hierarchy.countryId || prop.countryId,
    stateId: hierarchy.stateId || prop.stateId,
    cityId: hierarchy.cityId || prop.cityId,
    areaId: hierarchy.areaId || prop.areaId,
    location: {
      ...prop.location,
      ...(hierarchy.country ? { country: hierarchy.country } : {}),
      ...(hierarchy.state ? { state: hierarchy.state } : {}),
      ...(hierarchy.city ? { city: hierarchy.city } : {}),
      ...(hierarchy.locality ? { locality: hierarchy.locality } : {}),
    },
  });
}
