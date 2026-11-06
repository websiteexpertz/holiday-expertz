import fs from "fs";
import path from "path";
import { CustomerUserRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend") || process.cwd().endsWith("backend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "customers.json");

let customersCache: CustomerUserRecord[] | null = null;

const SEED_CUSTOMERS: CustomerUserRecord[] = [
  {
    id: "cust-001",
    fullName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 98765 43210",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    city: "New Delhi",
    country: "India",
    totalBookings: 3,
    createdAt: "2026-03-15T10:00:00.000Z",
    updatedAt: "2026-10-18T10:30:00.000Z",
  },
  {
    id: "cust-002",
    fullName: "Priya Nair",
    email: "priya.nair@example.com",
    phone: "+91 99887 76655",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    city: "Bengaluru",
    country: "India",
    totalBookings: 2,
    createdAt: "2026-05-20T14:00:00.000Z",
    updatedAt: "2026-10-19T14:15:00.000Z",
  },
  {
    id: "cust-003",
    fullName: "Rohan Kapoor",
    email: "rohan.kapoor@example.com",
    phone: "+91 91234 56789",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    city: "Mumbai",
    country: "India",
    totalBookings: 1,
    createdAt: "2026-08-11T16:30:00.000Z",
    updatedAt: "2026-10-21T09:00:00.000Z",
  },
  {
    id: "cust-004",
    fullName: "Sneha Patel",
    email: "sneha.patel@example.com",
    phone: "+91 97654 32109",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    city: "Ahmedabad",
    country: "India",
    totalBookings: 4,
    createdAt: "2026-02-01T11:00:00.000Z",
    updatedAt: "2026-10-08T11:00:00.000Z",
  },
  {
    id: "cust-005",
    fullName: "Devendra Verma",
    email: "dev.verma@example.com",
    phone: "+91 98111 22334",
    status: "active",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    city: "Pune",
    country: "India",
    totalBookings: 1,
    createdAt: "2026-09-10T12:00:00.000Z",
    updatedAt: "2026-10-04T15:30:00.000Z",
  },
];

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_CUSTOMERS, null, 2), "utf-8");
  }
}

export function getAllCustomers(): CustomerUserRecord[] {
  if (customersCache !== null) {
    return customersCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    customersCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_CUSTOMERS;
    return customersCache;
  } catch (error) {
    console.error("Backend Customer Storage Error:", error);
    customersCache = SEED_CUSTOMERS;
    return customersCache;
  }
}

export function saveCustomers(customers: CustomerUserRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(customers, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    customersCache = customers;
  } catch (error) {
    console.error("Failed to persist customers:", error);
    throw new Error("Failed to persist customers to storage.");
  }
}

export function getCustomerById(id: string): CustomerUserRecord | undefined {
  return getAllCustomers().find((c) => c.id === id);
}

export function updateCustomerStatus(id: string, status: CustomerUserRecord["status"]): CustomerUserRecord | null {
  const customers = getAllCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) return null;

  customers[index] = {
    ...customers[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  saveCustomers(customers);
  return customers[index];
}
