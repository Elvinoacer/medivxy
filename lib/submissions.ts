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

async function append(file: string, entry: Record<string, unknown>) {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const target = path.join(DATA_DIR, file);
    let list: unknown[] = [];
    try {
      list = JSON.parse(await fs.readFile(target, "utf8")) as unknown[];
      if (!Array.isArray(list)) list = [];
    } catch {
      list = [];
    }
    list.push(entry);
    await fs.writeFile(target, JSON.stringify(list, null, 2), "utf8");
  } catch {
    // demo store is best-effort only
  }
}

export async function logSubmission(kind: "contact" | "request", data: Record<string, unknown>) {
  const status = kind === "request" ? { status: "received" as const } : {};
  await append(
    kind === "contact" ? "contact-submissions.json" : REQUESTS_FILE,
    { ...data, ...status, receivedAt: new Date().toISOString() }
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
  try {
    const list = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, REQUESTS_FILE), "utf8")
    );
    return Array.isArray(list) ? (list as StoredRequest[]) : [];
  } catch {
    return [];
  }
}

async function writeRequests(list: StoredRequest[]): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      path.join(DATA_DIR, REQUESTS_FILE),
      JSON.stringify(list, null, 2),
      "utf8"
    );
    return true;
  } catch {
    return false;
  }
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
  if (!(await writeRequests(list))) return null;
  return toFull(list[idx]);
}
