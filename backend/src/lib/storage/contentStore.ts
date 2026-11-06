import fs from "fs";
import path from "path";
import { WebsiteContentRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "websiteContent.json");

let contentCache: WebsiteContentRecord | null = null;

const DEFAULT_CONTENT: WebsiteContentRecord = {
  hero: {
    headline: "Escape the ordinary. Stay extraordinary.",
    subheadline: "Discover exceptional stays, from secluded mountain retreats to private luxury villas.",
    badgeText: "HOLIDAY EXPERTZ • LUXURY STAYS",
    ctaText: "Search Stays",
    ctaLink: "#search",
    backgroundImages: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=85",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2400&q=85",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2400&q=85",
    ],
    slides: [
      {
        id: "slide-1",
        imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2400&q=85",
        altText: "Tropical luxury villa with infinity pool overlooking mountain range",
        title: "Mountain Retreats",
        category: "Mountain Retreats",
        order: 1,
        isActive: true,
      },
      {
        id: "slide-2",
        imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2400&q=85",
        altText: "Private luxury villa with turquoise swimming pool and sun loungers",
        title: "Private Villas",
        category: "Private Villas",
        order: 2,
        isActive: true,
      },
      {
        id: "slide-3",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=85",
        altText: "Regal heritage palace hotel with serene courtyard reflections",
        title: "Heritage Stays",
        category: "Heritage Stays",
        order: 3,
        isActive: true,
      },
      {
        id: "slide-4",
        imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=2400&q=85",
        altText: "Luxury riverside retreat amidst tranquil tropical waters",
        title: "Riverside Escapes",
        category: "Riverside Escapes",
        order: 4,
        isActive: true,
      },
    ],
  },
  whyChooseUs: [
    {
      id: "wcu-1",
      title: "100% Handpicked & Verified",
      description: "Every resort and villa passes our rigorous 50-point hospitality and hygiene audit before listing.",
      icon: "ShieldCheck",
    },
    {
      id: "wcu-2",
      title: "Best Price Guarantee",
      description: "Direct owner pricing with zero hidden convenience surcharges or inflated OTA commissions.",
      icon: "Tag",
    },
    {
      id: "wcu-3",
      title: "24/7 Dedicated Concierge",
      description: "Personal travel specialists to craft customized itineraries, candlelit dinners, and private transfers.",
      icon: "Headphones",
    },
    {
      id: "wcu-4",
      title: "Seamless Direct Booking",
      description: "Instant booking confirmation with transparent payment protection and flexible cancellation options.",
      icon: "Sparkles",
    },
  ],
  aboutSummary: {
    title: "Crafting Unforgettable Holiday Stories Since 2020",
    description: "HolidayExpertz connects discerning travelers with extraordinary accommodations. From Aravali lake palaces to misty Western Ghats plantations, our mission is to deliver authentic luxury with genuine warmth.",
    yearsInService: 6,
    propertiesManaged: 450,
    happyTravelers: 85000,
    destinationsCovered: 48,
  },
  contactInfo: {
    email: "support@holidayexpertz.com",
    phone: "+91 80000 12345",
    address: "Regus Signature Tower, Level 4, DLF Cyber City, Gurugram, Haryana 122002",
    whatsappNumber: "+91 80000 12345",
    officeHours: "Monday to Saturday, 9:00 AM - 8:00 PM IST",
  },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), "utf-8");
  }
}

export function getWebsiteContent(): WebsiteContentRecord {
  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    contentCache = (parsed && typeof parsed === "object" ? parsed : DEFAULT_CONTENT) as WebsiteContentRecord;
    return contentCache!;
  } catch (error) {
    console.error("Backend Content Storage Error:", error);
    contentCache = DEFAULT_CONTENT;
    return contentCache!;
  }
}

export function saveWebsiteContent(content: WebsiteContentRecord): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(content, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    contentCache = content;
  } catch (error) {
    console.error("Failed to persist website content:", error);
    throw new Error("Failed to persist website content to storage.");
  }
}

export function updateWebsiteContent(updates: Partial<WebsiteContentRecord>): WebsiteContentRecord {
  const current = getWebsiteContent();
  const nextHero = updates.hero ? { ...current.hero, ...updates.hero } : current.hero;

  // Sync backgroundImages with active slides if slides are provided
  if (nextHero.slides && Array.isArray(nextHero.slides)) {
    const activeSlideUrls = nextHero.slides
      .filter((s) => s.isActive)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.imageUrl);
    if (activeSlideUrls.length > 0) {
      nextHero.backgroundImages = activeSlideUrls;
    }
  }

  const updated: WebsiteContentRecord = {
    ...current,
    ...updates,
    hero: nextHero,
    updatedAt: new Date().toISOString(),
  };

  saveWebsiteContent(updated);
  return updated;
}
