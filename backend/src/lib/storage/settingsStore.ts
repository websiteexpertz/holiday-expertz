import fs from "fs";
import path from "path";
import { WebsiteSettingsRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "websiteSettings.json");

let settingsCache: WebsiteSettingsRecord | null = null;

const DEFAULT_SETTINGS: WebsiteSettingsRecord = {
  siteName: "HolidayExpertz",
  tagline: "Curated Luxury Stays, Palaces & Boutique Villas",
  supportEmail: "support@holidayexpertz.com",
  supportPhone: "+91 80000 12345",
  currency: "INR",
  currencySymbol: "₹",
  defaultSeoTitle: "HolidayExpertz | Premier Luxury Stays & Resort Bookings",
  defaultSeoDescription: "Discover and book handpicked heritage palaces, beachfront resorts, and luxury mountain villas across India with verified quality standards and direct owner prices.",
  enableGuestReviews: true,
  allowInstantBooking: true,
  autoApproveProperties: false,
  maintenanceMode: false,
  socialLinks: {
    facebook: "https://facebook.com/holidayexpertz",
    instagram: "https://instagram.com/holidayexpertz",
    twitter: "https://twitter.com/holidayexpertz",
    linkedin: "https://linkedin.com/company/holidayexpertz",
  },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf-8");
  }
}

export function getWebsiteSettings(): WebsiteSettingsRecord {
  if (settingsCache !== null) {
    return settingsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    settingsCache = (parsed && typeof parsed === "object" ? parsed : DEFAULT_SETTINGS) as WebsiteSettingsRecord;
    return settingsCache!;
  } catch (error) {
    console.error("Backend Settings Storage Error:", error);
    settingsCache = DEFAULT_SETTINGS;
    return settingsCache!;
  }
}

export function saveWebsiteSettings(settings: WebsiteSettingsRecord): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(settings, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    settingsCache = settings;
  } catch (error) {
    console.error("Failed to persist website settings:", error);
    throw new Error("Failed to persist website settings to storage.");
  }
}

export function updateWebsiteSettings(updates: Partial<WebsiteSettingsRecord>): WebsiteSettingsRecord {
  const current = getWebsiteSettings();
  const updated: WebsiteSettingsRecord = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveWebsiteSettings(updated);
  return updated;
}
