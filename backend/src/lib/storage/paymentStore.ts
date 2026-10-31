import fs from "fs";
import path from "path";
import { PaymentRecord } from "../../types/admin";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "payments.json");

let paymentsCache: PaymentRecord[] | null = null;

const SEED_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay-2001",
    transactionReference: "TXN_RZP_9012345",
    bookingId: "book-1001",
    bookingReference: "HX-2026-98101",
    ownerId: "owner_1792593465325_2dc1c289",
    payerName: "Aarav Sharma",
    payerEmail: "aarav.sharma@example.com",
    amount: 114000,
    currency: "INR",
    type: "booking_payment",
    gateway: "Razorpay",
    status: "successful",
    gatewayTransactionId: "pay_PkL1093Jsk92",
    createdAt: "2026-10-18T10:32:15.000Z",
  },
  {
    id: "pay-2002",
    transactionReference: "TXN_STR_4490123",
    bookingId: "book-1002",
    bookingReference: "HX-2026-98102",
    ownerId: "owner_1792593465325_2dc1c289",
    payerName: "Priya Nair",
    payerEmail: "priya.nair@example.com",
    amount: 66000,
    currency: "INR",
    type: "booking_payment",
    gateway: "Stripe",
    status: "successful",
    gatewayTransactionId: "ch_3Nk91L2eZvKYlo2C",
    createdAt: "2026-10-19T14:16:02.000Z",
  },
  {
    id: "pay-2003",
    transactionReference: "SUB_EXP_88201",
    ownerId: "owner_1792593465325_2dc1c289",
    payerName: "Vikram Singhania",
    payerEmail: "owner@singhaniapalace.com",
    amount: 14999,
    currency: "INR",
    type: "subscription_fee",
    gateway: "UPI",
    status: "successful",
    gatewayTransactionId: "upi_ref_778819203",
    createdAt: "2026-10-15T11:00:00.000Z",
  },
  {
    id: "pay-2004",
    transactionReference: "TXN_RZP_9012489",
    bookingId: "book-1004",
    bookingReference: "HX-2026-98104",
    ownerId: "owner_1792593465325_2dc1c289",
    payerName: "Sneha Patel",
    payerEmail: "sneha.patel@example.com",
    amount: 94500,
    currency: "INR",
    type: "booking_payment",
    gateway: "Razorpay",
    status: "successful",
    gatewayTransactionId: "pay_QpM3382Klq01",
    createdAt: "2026-09-28T16:22:10.000Z",
  },
  {
    id: "pay-2005",
    transactionReference: "REF_RZP_110293",
    bookingId: "book-1005",
    bookingReference: "HX-2026-98105",
    ownerId: "owner_1792593465325_2dc1c289",
    payerName: "Devendra Verma",
    payerEmail: "dev.verma@example.com",
    amount: 66000,
    refundedAmount: 66000,
    currency: "INR",
    type: "refund",
    gateway: "Razorpay",
    status: "refunded",
    gatewayTransactionId: "rfnd_992019Ksdw1",
    createdAt: "2026-10-04T15:35:00.000Z",
  },
];

function ensureStorageExists(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_PAYMENTS, null, 2), "utf-8");
  }
}

export function getAllPayments(): PaymentRecord[] {
  if (paymentsCache !== null) {
    return paymentsCache;
  }

  try {
    ensureStorageExists();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    paymentsCache = Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_PAYMENTS;
    return paymentsCache;
  } catch (error) {
    console.error("Backend Payment Storage Error:", error);
    paymentsCache = SEED_PAYMENTS;
    return paymentsCache;
  }
}

export function savePayments(payments: PaymentRecord[]): void {
  try {
    ensureStorageExists();
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    const payload = JSON.stringify(payments, null, 2);
    fs.writeFileSync(tempFile, payload, "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    paymentsCache = payments;
  } catch (error) {
    console.error("Failed to persist payments:", error);
    throw new Error("Failed to persist payments to storage.");
  }
}

export function getPaymentById(id: string): PaymentRecord | undefined {
  return getAllPayments().find((p) => p.id === id);
}

export function createPayment(input: Omit<PaymentRecord, "id" | "transactionReference" | "createdAt">): PaymentRecord {
  const payments = getAllPayments();
  const id = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transactionReference = `TXN_HX_${Date.now()}`;
  const now = new Date().toISOString();

  const record: PaymentRecord = {
    ...input,
    id,
    transactionReference,
    createdAt: now,
  };

  payments.unshift(record);
  savePayments(payments);
  return record;
}

export function updatePaymentStatus(
  id: string,
  status: PaymentRecord["status"],
  refundedAmount?: number
): PaymentRecord | null {
  const payments = getAllPayments();
  const index = payments.findIndex((p) => p.id === id);
  if (index === -1) return null;

  payments[index] = {
    ...payments[index],
    status,
    ...(refundedAmount !== undefined ? { refundedAmount } : {}),
  };

  savePayments(payments);
  return payments[index];
}
