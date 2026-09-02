import fs from "node:fs/promises";
import path from "node:path";
import { makeReference } from "@/lib/utils";
import type { BookingFull, BookingPublic, BookingStatus } from "@/lib/types";

export type { BookingFull, BookingPublic, BookingStatus };
export {
  CONSULT_TYPES,
  consultLabel,
  slotsForDate,
  slotLabel,
  slotPeriod,
  bookingSummary,
  validateBookingInput,
} from "@/lib/booking-shared";
export type { ConsultType } from "@/lib/booking-shared";

/**
 * Consultation booking store (SERVER-ONLY — uses node:fs).
 *
 * Demo extension of the operational loop (research.md §8 services +
 * Phase-4 roadmap): customers book a pharmacist consultation slot, staff
 * confirm/complete it from the admin dashboard. Files are gitignored demo
 * storage — swap for a real database + calendar before production.
 *
 * Improvements in this revision:
 *  - Atomic writes (temp file + rename) — no truncated JSON on crash.
 *  - `logBooking` returns success so the API route can surface a failure
 *    to the customer instead of losing the booking silently.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const BOOKINGS_FILE = "bookings.json";

const VALID_STATUSES: BookingStatus[] = ["requested", "confirmed", "completed"];

interface StoredBooking {
  reference: string;
  consultType: string;
  date: string;
  slot: string;
  fullName: string;
  phone: string;
  notes: string;
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

async function readBookings(): Promise<StoredBooking[]> {
  try {
    const list = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, BOOKINGS_FILE), "utf8")
    );
    return Array.isArray(list) ? (list as StoredBooking[]) : [];
  } catch {
    return [];
  }
}

function toFull(rec: StoredBooking): BookingFull {
  return {
    reference: rec.reference,
    consultType: rec.consultType,
    date: rec.date,
    slot: rec.slot,
    fullName: rec.fullName,
    phone: rec.phone,
    notes: rec.notes,
    status: isBookingStatus(rec.status) ? rec.status : "requested",
    receivedAt: rec.receivedAt,
  };
}

function isBookingStatus(value: unknown): value is BookingStatus {
  return typeof value === "string" && (VALID_STATUSES as string[]).includes(value);
}

export function isValidBookingStatus(value: unknown): value is BookingStatus {
  return isBookingStatus(value);
}

export async function logBooking(input: {
  reference: string;
  consultType: string;
  date: string;
  slot: string;
  fullName: string;
  phone: string;
  notes: string;
}): Promise<boolean> {
  const entry: StoredBooking = { ...input, status: "requested", receivedAt: new Date().toISOString() };
  const list = await readBookings();
  list.push(entry);
  return atomicWriteJson(BOOKINGS_FILE, list);
}

export function newBookingReference(): string {
  return makeReference("BKG");
}

/** Accepts "BKG-XXXX", "bkg xxxx", "BKGXXXX" → "BKG-XXXX" (or "" if invalid). */
export function normalizeBookingReference(input: string): string {
  const match = input.trim().toUpperCase().match(/^BKG[-\s]?([A-Z0-9]{4})$/);
  return match ? `BKG-${match[1]}` : "";
}

export async function listBookings(): Promise<BookingFull[]> {
  return (await readBookings()).map(toFull).sort((a, b) =>
    (a.date + a.slot).localeCompare(b.date + b.slot)
  );
}

/** Privacy-safe public lookup for the tracking page — no name, phone or notes. */
export async function findBooking(reference: string): Promise<BookingPublic | null> {
  const ref = normalizeBookingReference(reference);
  if (!ref) return null;
  const list = await readBookings();
  const rec = list.find((r) => r.reference.toUpperCase() === ref);
  if (!rec) return null;
  const full = toFull(rec);
  return {
    reference: full.reference,
    consultType: full.consultType,
    date: full.date,
    slot: full.slot,
    status: full.status,
    receivedAt: full.receivedAt,
  };
}

export async function updateBookingStatus(
  reference: string,
  status: BookingStatus
): Promise<BookingFull | null> {
  const ref = normalizeBookingReference(reference);
  if (!ref) return null;
  const list = await readBookings();
  const idx = list.findIndex((r) => r.reference.toUpperCase() === ref);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status };
  if (!(await atomicWriteJson(BOOKINGS_FILE, list))) return null;
  return toFull(list[idx]);
}
