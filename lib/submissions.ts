import fs from "node:fs/promises";
import path from "node:path";
import { makeReference } from "@/lib/utils";
import type { MedicineRequestFull, MedicineRequestStatus } from "@/lib/types";

export type { MedicineRequestFull, MedicineRequestStatus };

/**
 * Demo submission store (research.md §23–24).
 * Appends contact / medicine requests to a local JSON file so the demo has
 * a realistic "admin-ready" trail. Files are gitignored; swap for a real
 * database before production.
 *
 * Improvements in this revision:
 *  - Writes are ATOMIC (temp file + rename) so a crash mid-write can never
 *    truncate the store, and concurrent requests can't clobber each other
 *    with half-written JSON.
 *  - `logSubmission` now RETURNS success so API routes can tell the user
 *    when the demo store failed instead of silently dropping the request.
 *  - A MDX-DEMO seed record is created on first read so the advertised
 *    demo chip on /track resolves out of the box (mirrors BKG-DEMO in
 *    data/bookings.json).
 */
const DATA_DIR = path.join(process.cwd(), "data");
const REQUESTS_FILE = "medicine-requests.json";

const VALID_STATUSES: MedicineRequestStatus[] = [
  "received",
  "confirmed",
  "ready",
  "fulfilled",
];

interface StoredRequest {
  reference: string;
  medicine: string;
  fullName: string;
  phone: string;
  notes: string;
  contactMethod: string;
  fulfilment: string;
  prescriptionFileName: string;
  status?: string;
  receivedAt: string;
}

/** Atomic write: serialise to a temp file, then rename over the target. */
async function atomicWriteJson(file: string, data: unknown): Promise<boolean> {
  const target = path.join(DATA_DIR, file);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, target);
    return true;
  } catch {
    try {
      await fs.rm(tmp, { force: true });
    } catch {
      // best-effort cleanup only
    }
    return false;
  }
}

async function readJsonArray(file: string): Promise<unknown[]> {
  try {
    const list = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, file), "utf8")
    );
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/* ── Demo seed ──
 * The /track page advertises a "Demo: MDX-DEMO" chip; without a seed record
 * the chip always says "couldn't find" on a fresh clone (the live file is
 * gitignored). Create it once, lazily, so the demo works everywhere. */
const DEMO_REQUEST_REF = "MDX-DEMO";

async function ensureDemoSeed(): Promise<void> {
  try {
    await fs.access(path.join(DATA_DIR, REQUESTS_FILE));
    return; // file exists — nothing to seed
  } catch {
    // file missing → create it with the demo record
    const demo: StoredRequest = {
      reference: DEMO_REQUEST_REF,
      medicine: "Paracetamol 500mg tablets + ORS sachets (demo request)",
      fullName: "Demo Customer",
      phone: "+254 700 000 000",
      notes: "Seeded demo record so the tracking demo chip resolves.",
      contactMethod: "whatsapp",
      fulfilment: "pickup",
      prescriptionFileName: "",
      status: "confirmed",
      receivedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    };
    await atomicWriteJson(REQUESTS_FILE, [demo]);
  }
}

export async function logSubmission(
  kind: "contact" | "request",
  data: Record<string, unknown>
): Promise<boolean> {
  const status = kind === "request" ? { status: "received" as const } : {};
  if (kind === "request") await ensureDemoSeed();
  const list = await readJsonArray(
    kind === "request" ? REQUESTS_FILE : "contact-submissions.json"
  );
  list.push({ ...data, ...status, receivedAt: new Date().toISOString() });
  return atomicWriteJson(
    kind === "request" ? REQUESTS_FILE : "contact-submissions.json",
    list
  );
}

export function newReference(): string {
  return makeReference("MDX");
}

/* ── Medicine-request tracking helpers (shared by API routes) ── */

/** Accepts "MDX-V9QW", "mdx v9qw", "MDXV9QW" → "MDX-V9QW" (or "" if invalid). */
export function normalizeReference(input: string): string {
  const match = input.trim().toUpperCase().match(/^MDX[-\s]?([A-Z0-9]{4})$/);
  return match ? `MDX-${match[1]}` : "";
}

export function isValidStatus(value: unknown): value is MedicineRequestStatus {
  return typeof value === "string" && (VALID_STATUSES as string[]).includes(value);
}

function statusOf(rec: StoredRequest): MedicineRequestStatus {
  return isValidStatus(rec.status) ? rec.status : "received";
}

async function readRequests(): Promise<StoredRequest[]> {
  await ensureDemoSeed();
  const list = await readJsonArray(REQUESTS_FILE);
  return list as StoredRequest[];
}

function toFull(rec: StoredRequest): MedicineRequestFull {
  return {
    reference: rec.reference,
    medicine: rec.medicine,
    fullName: rec.fullName,
    phone: rec.phone,
    notes: rec.notes,
    contactMethod: rec.contactMethod,
    fulfilment: rec.fulfilment === "delivery" ? "delivery" : "pickup",
    prescriptionFileName: rec.prescriptionFileName ?? "",
    status: statusOf(rec),
    receivedAt: rec.receivedAt,
  };
}

export async function listMedicineRequests(): Promise<MedicineRequestFull[]> {
  return (await readRequests()).map(toFull).sort((a, b) =>
    b.receivedAt.localeCompare(a.receivedAt)
  );
}

/** Find one request by reference (case/space tolerant). */
export async function findMedicineRequest(
  reference: string
): Promise<MedicineRequestFull | null> {
  const ref = normalizeReference(reference);
  if (!ref) return null;
  const list = await readRequests();
  const found = list.find((r) => r.reference.toUpperCase() === ref);
  return found ? toFull(found) : null;
}

/** Update a request's status (admin demo action). */
export async function updateMedicineRequestStatus(
  reference: string,
  status: MedicineRequestStatus
): Promise<MedicineRequestFull | null> {
  const ref = normalizeReference(reference);
  if (!ref) return null;
  const list = await readRequests();
  const idx = list.findIndex((r) => r.reference.toUpperCase() === ref);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status };
  if (!(await atomicWriteJson(REQUESTS_FILE, list))) return null;
  return toFull(list[idx]);
}
