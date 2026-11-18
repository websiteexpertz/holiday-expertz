import fs from "fs";
import path from "path";
import { Property, PropertyDashboardStats, PropertyStatus } from "../../types/property";
import { connectToDatabase } from "../db/mongodb";
import { PropertyModel } from "../models/Property";

function getDataFilePath(): string {
  const directPath = path.join(process.cwd(), "src", "data", "properties.json");
  if (fs.existsSync(directPath)) return directPath;

  const backendPath = path.join(process.cwd(), "backend", "src", "data", "properties.json");
  if (fs.existsSync(backendPath)) return backendPath;

  const parentBackendPath = path.join(path.resolve(process.cwd(), ".."), "backend", "src", "data", "properties.json");
  if (fs.existsSync(parentBackendPath)) return parentBackendPath;

  const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
  return path.join(rootDir, "backend", "src", "data", "properties.json");
}

let propertiesCache: Property[] | null = null;

function ensureStorageExists(): void {
  const filePath = getDataFilePath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf-8");
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
    const filePath = getDataFilePath();
    const raw = fs.readFileSync(filePath, "utf-8");
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
  propertiesCache = properties;

  try {
    ensureStorageExists();
    const filePath = getDataFilePath();
    const tempFile = `${filePath}.tmp.${Date.now()}`;
    const payload = JSON.stringify(properties, null, 2);

    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, filePath);
  } catch (error) {
    console.warn("Property JSON persistence unavailable; using MongoDB:", error);
  }

  connectToDatabase()
    .then(async () => {
      for (const p of properties) {
        await PropertyModel.findOneAndUpdate({ id: p.id }, p, { upsert: true });
      }
    })
    .catch((error) => {
      console.error("MongoDB property persistence failed:", error);
    });
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
  // Ensure propertyNumber is immutable and can never be overwritten by updates
  const { propertyNumber: _ignoredPropNum, ...safeUpdates } = updates;
  const updated: Property = {
    ...current,
    ...safeUpdates,
    propertyNumber: current.propertyNumber,
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

export function togglePropertyFeaturedRecord(id: string, explicitValue?: boolean): Property | null {
  const prop = getPropertyById(id);
  if (!prop) return null;
  const current = Boolean(prop.featured ?? prop.isFeatured);
  const nextValue = explicitValue !== undefined ? explicitValue : !current;
  return updatePropertyRecord(id, {
    featured: nextValue,
    isFeatured: nextValue,
  });
}

export function togglePropertyHandpickedRecord(id: string, explicitValue?: boolean): Property | null {
  const prop = getPropertyById(id);
  if (!prop) return null;
  const current = Boolean(prop.handpicked ?? prop.isHandpicked);
  const nextValue = explicitValue !== undefined ? explicitValue : !current;
  return updatePropertyRecord(id, {
    handpicked: nextValue,
    isHandpicked: nextValue,
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
