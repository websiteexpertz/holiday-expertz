import fs from "fs";
import path from "path";
import { AuditLogRecord } from "../../types/admin";
import defaultAuditLogs from "../../data/auditLogs.json";

const rootDir = process.cwd().endsWith("frontend")
  ? path.resolve(process.cwd(), "..")
  : process.cwd();
const DATA_FILE = path.join(rootDir, "backend", "src", "data", "auditLogs.json");

let auditCache: AuditLogRecord[] | null = null;

function ensureStorageExists(): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultAuditLogs, null, 2), "utf-8");
    }
  } catch {
    // Read-only filesystem on serverless (e.g. Vercel)
  }
}

export function getAllAuditLogs(): AuditLogRecord[] {
  if (auditCache !== null) {
    return auditCache;
  }

  try {
    ensureStorageExists();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      auditCache = Array.isArray(parsed) ? parsed : [];
      auditCache.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return auditCache;
    }
  } catch (error) {
    // Fall back to bundled data
  }

  auditCache = Array.isArray(defaultAuditLogs) ? (defaultAuditLogs as AuditLogRecord[]) : [];
  return auditCache;
}

export function createAuditLog(entry: Omit<AuditLogRecord, "id" | "createdAt">): AuditLogRecord {
  const logs = getAllAuditLogs();
  const record: AuditLogRecord = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...entry,
    createdAt: new Date().toISOString(),
  };

  try {
    ensureStorageExists();
    const updated = [record, ...logs];
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(updated, null, 2), "utf-8");
    fs.renameSync(tempFile, DATA_FILE);
    auditCache = updated;
    return record;
  } catch (error) {
    console.error("Backend Audit Storage Error: Failed to persist audit log:", error);
    return record;
  }
}

export function getFilteredAuditLogs(options: {
  module?: string;
  adminId?: string;
  search?: string;
  limit?: number;
}): AuditLogRecord[] {
  let logs = getAllAuditLogs();

  if (options.module && options.module !== "all") {
    logs = logs.filter((l) => l.module.toLowerCase() === options.module?.toLowerCase());
  }

  if (options.adminId && options.adminId !== "all") {
    logs = logs.filter((l) => l.adminId === options.adminId);
  }

  if (options.search?.trim()) {
    const q = options.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.adminName.toLowerCase().includes(q) ||
        l.adminEmail.toLowerCase().includes(q) ||
        (l.resourceId && l.resourceId.toLowerCase().includes(q))
    );
  }

  if (options.limit && options.limit > 0) {
    logs = logs.slice(0, options.limit);
  }

  return logs;
}

/** Alias for createAuditLog — used by route handlers */
export const recordAuditLog = createAuditLog;

/** Returns the most recent N audit log entries */
export function getRecentAuditLogs(limit = 10): AuditLogRecord[] {
  return getAllAuditLogs().slice(0, limit);
}
