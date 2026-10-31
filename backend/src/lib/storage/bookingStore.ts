import fs from "fs";
import path from "path";
import { BookingRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "bookings.json");

let bookingsCache: BookingRecord[] | null = null;

const SEED_BOOKINGS: BookingRecord[] = [
  {
    id: "book-1001",
    bookingReference: "HX-2026-98101",
    propertyId: "prop_1792595900000_a1b2c3d4",
    propertyName: "Singhania Heritage Palace & Spa",
    propertyCoverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    propertyCity: "Udaipur",
    ownerId: "owner_1792593465325_2dc1c289",
    ownerName: "Vikram Singhania",
    customerId: "cust-001",
    customerName: "Aarav Sharma",
    customerEmail: "aarav.sharma@example.com",
    customerPhone: "+91 98765 43210",
    checkInDate: "2026-11-10",
    checkOutDate: "2026-11-14",
    guests: 2,
    totalAmount: 114000,
    currency: "INR",
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    specialRequests: "Anniversary celebration setup with candlelit balcony dinner.",
    createdAt: "2026-10-18T10:30:00.000Z",
    updatedAt: "2026-10-18T10:30:00.000Z",
  },
  {
    id: "book-1002",
    bookingReference: "HX-2026-98102",
    propertyId: "h-2",
    propertyName: "Taj Exotica Resort & Spa",
    propertyCoverImage: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
    propertyCity: "Goa",
    ownerId: "owner_1792593465325_2dc1c289",
    ownerName: "Vikram Singhania",
    customerId: "cust-002",
    customerName: "Priya Nair",
    customerEmail: "priya.nair@example.com",
    customerPhone: "+91 99887 76655",
    checkInDate: "2026-10-25",
    checkOutDate: "2026-10-28",
    guests: 3,
    totalAmount: 66000,
    currency: "INR",
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    specialRequests: "Airport transfer request for 2:30 PM arrival at Dabolim.",
    createdAt: "2026-10-19T14:15:00.000Z",
    updatedAt: "2026-10-19T14:15:00.000Z",
  },
  {
    id: "book-1003",
    bookingReference: "HX-2026-98103",
    propertyId: "prop_1792595900000_a1b2c3d4",
    propertyName: "Singhania Heritage Palace & Spa",
    propertyCoverImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    propertyCity: "Udaipur",
    ownerId: "owner_1792593465325_2dc1c289",
    ownerName: "Vikram Singhania",
    customerId: "cust-003",
    customerName: "Rohan Kapoor",
    customerEmail: "rohan.kapoor@example.com",
    customerPhone: "+91 91234 56789",
    checkInDate: "2026-11-01",
    checkOutDate: "2026-11-03",
    guests: 4,
    totalAmount: 57000,
    currency: "INR",
    bookingStatus: "pending",
    paymentStatus: "pending",
    createdAt: "2026-10-21T09:00:00.000Z",
    updatedAt: "2026-10-21T09:00:00.000Z",
  },
  {
    id: "book-1004",
    bookingReference: "HX-2026-98104",
    propertyId: "h-3",
    propertyName: "Wildflower Hall, An Oberoi Resort",
    propertyCoverImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    propertyCity: "Shimla",
    ownerId: "owner_1792593465325_2dc1c289",
    ownerName: "Vikram Singhania",
    customerId: "cust-004",
    customerName: "Sneha Patel",
    customerEmail: "sneha.patel@example.com",
    customerPhone: "+91 97654 32109",
    checkInDate: "2026-10-05",
    checkOutDate: "2026-10-08",
    guests: 2,
    totalAmount: 94500,
    currency: "INR",
    bookingStatus: "completed",
    paymentStatus: "paid",
    createdAt: "2026-09-28T16:20:00.000Z",
    updatedAt: "2026-10-08T11:00:00.000Z",
  },
  {
    id: "book-1005",
    bookingReference: "HX-2026-98105",
    propertyId: "h-2",
    propertyName: "Taj Exotica Resort & Spa",
    propertyCoverImage: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=80",
    propertyCity: "Goa",
    ownerId: "owner_1792593465325_2dc1c289",
    ownerName: "Vikram Singhania",
    customerId: "cust-005",
    customerName: "Devendra Verma",
    customerEmail: "dev.verma@example.com",
    customerPhone: "+91 98111 22334",
    checkInDate: "2026-10-12",
    checkOutDate: "2026-10-15",
    guests: 2,
    totalAmount: 66000,
    currency: "INR",
    bookingStatus: "cancelled",
    paymentStatus: "refunded",
    cancellationReason: "Change of business travel schedule.",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-04T15:30:00.000Z",
  },
];

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_BOOKINGS, null, 2), "utf-8");
  }
}

export function getAllBookings(): BookingRecord[] {
  if (bookingsCache !== null) {
    return bookingsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    bookingsCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_BOOKINGS;
    return bookingsCache;
  } catch (error) {
    console.error("Backend Booking Storage Error:", error);
    bookingsCache = SEED_BOOKINGS;
    return bookingsCache;
  }
}

export function saveBookings(bookings: BookingRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(bookings, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    bookingsCache = bookings;
  } catch (error) {
    console.error("Failed to persist bookings:", error);
    throw new Error("Failed to persist bookings to storage.");
  }
}

export function getBookingById(id: string): BookingRecord | undefined {
  return getAllBookings().find((b) => b.id === id);
}

export function getBookingByReference(ref: string): BookingRecord | undefined {
  return getAllBookings().find((b) => b.bookingReference.toLowerCase() === ref.toLowerCase());
}

export function createBooking(input: Omit<BookingRecord, "id" | "bookingReference" | "createdAt" | "updatedAt">): BookingRecord {
  const bookings = getAllBookings();
  const id = `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const bookingReference = `HX-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();

  const record: BookingRecord = {
    ...input,
    id,
    bookingReference,
    createdAt: now,
    updatedAt: now,
  };

  bookings.unshift(record);
  saveBookings(bookings);
  return record;
}

export function updateBooking(id: string, updates: Partial<BookingRecord>): BookingRecord | null {
  const bookings = getAllBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;

  const current = bookings[index];
  const updated: BookingRecord = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
  };

  bookings[index] = updated;
  saveBookings(bookings);
  return updated;
}

export function deleteBooking(id: string): boolean {
  const bookings = getAllBookings();
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return false;

  bookings.splice(index, 1);
  saveBookings(bookings);
  return true;
}
