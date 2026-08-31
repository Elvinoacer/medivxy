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

async function writeBookings(list: StoredBooking[]): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      path.join(DATA_DIR, BOOKINGS_FILE),
      JSON.stringify(list, null, 2),
      "utf8"
    );
    return true;
  } catch {
    return false;
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
}): Promise<void> {
  const entry: StoredBooking = { ...input, status: "requested", receivedAt: new Date().toISOString() };
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const target = path.join(DATA_DIR, BOOKINGS_FILE);
    let list: StoredBooking[] = [];
    try {
      list = JSON.parse(await fs.readFile(target, "utf8")) as StoredBooking[];
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
  if (!(await writeBookings(list))) return null;
  return toFull(list[idx]);
}
