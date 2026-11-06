import fs from "fs";
import path from "path";
import { ContactInquiryRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "inquiries.json");

let inquiriesCache: ContactInquiryRecord[] | null = null;

const SEED_INQUIRIES: ContactInquiryRecord[] = [
  {
    id: "inq-401",
    name: "Dr. Alok Verma",
    email: "alok.verma@delhihospital.org",
    phone: "+91 98101 23456",
    subject: "Corporate Retreat Booking for 35 Guests",
    message: "We are planning a 4-day annual leadership offsite in November 2026. Looking for luxury heritage palace with conference facilities and airport transfers.",
    relatedPropertyId: "prop_1792595900000_a1b2c3d4",
    relatedPropertyName: "Singhania Heritage Palace & Spa",
    status: "new",
    createdAt: "2026-10-21T11:20:00.000Z",
    updatedAt: "2026-10-21T11:20:00.000Z",
  },
  {
    id: "inq-402",
    name: "Sunil Narang",
    email: "sunil.narang@gmail.com",
    phone: "+91 99001 98765",
    subject: "Listing 2 Boutique Villas in North Goa",
    message: "I am a property owner with two luxury 4-BHK private pool villas in Assagao. Would love to know the verification and onboarding timeline.",
    status: "in_progress",
    adminNotes: "Contacted on WhatsApp. Scheduled onboarding call for Friday 3 PM.",
    assignedToAdminId: "admin-super-01",
    createdAt: "2026-10-20T16:45:00.000Z",
    updatedAt: "2026-10-21T10:00:00.000Z",
  },
  {
    id: "inq-403",
    name: "Radhika Sen",
    email: "radhika.sen@yahoo.com",
    subject: "Cancellation Policy Clarification",
    message: "If we cancel our winter booking 14 days before check-in, do we get a full refund or hotel credit?",
    status: "resolved",
    adminNotes: "Replied via email explaining flexible 7-day free cancellation clause.",
    assignedToAdminId: "admin-super-01",
    createdAt: "2026-10-18T14:10:00.000Z",
    updatedAt: "2026-10-19T09:30:00.000Z",
  },
];

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_INQUIRIES, null, 2), "utf-8");
  }
}

export function getAllInquiries(): ContactInquiryRecord[] {
  if (inquiriesCache !== null) {
    return inquiriesCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    inquiriesCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_INQUIRIES;
    return inquiriesCache;
  } catch (error) {
    console.error("Backend Inquiry Storage Error:", error);
    inquiriesCache = SEED_INQUIRIES;
    return inquiriesCache;
  }
}

export function saveInquiries(inquiries: ContactInquiryRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(inquiries, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    inquiriesCache = inquiries;
  } catch (error) {
    console.error("Failed to persist inquiries:", error);
    throw new Error("Failed to persist inquiries to storage.");
  }
}

export function getInquiryById(id: string): ContactInquiryRecord | undefined {
  return getAllInquiries().find((i) => i.id === id);
}

export function createInquiry(input: Omit<ContactInquiryRecord, "id" | "status" | "createdAt" | "updatedAt">): ContactInquiryRecord {
  const inquiries = getAllInquiries();
  const id = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const record: ContactInquiryRecord = {
    ...input,
    id,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };

  inquiries.unshift(record);
  saveInquiries(inquiries);
  return record;
}

export function updateInquiry(id: string, updates: Partial<ContactInquiryRecord>): ContactInquiryRecord | null {
  const inquiries = getAllInquiries();
  const index = inquiries.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = inquiries[index];
  const updated: ContactInquiryRecord = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
  };

  inquiries[index] = updated;
  saveInquiries(inquiries);
  return updated;
}

export function deleteInquiry(id: string): boolean {
  const inquiries = getAllInquiries();
  const index = inquiries.findIndex((i) => i.id === id);
  if (index === -1) return false;

  inquiries.splice(index, 1);
  saveInquiries(inquiries);
  return true;
}
