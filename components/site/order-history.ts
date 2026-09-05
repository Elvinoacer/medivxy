"use client";

/**
 * Device order history (demo).
 *
 * Orders placed on THIS device are remembered in localStorage so the tracking
 * page can offer one-tap lookup without the customer hunting for reference
 * codes. Mirrors the saved-profile philosophy: no payment data, no account,
 * easily cleared.
 */

export interface DeviceOrderEntry {
  reference: string;
  /** Grand total at checkout (KES). */
  total: number;
  itemCount: number;
  fulfilment: "pickup" | "delivery";
  /** Applied promo code ("" when none). */
  promoCode: string;
  /** MediPoints earned by this order (0 when unknown). */
  pointsEarned?: number;
  /** Prescription file metadata from a past Rx order (Rx reuse shortcut). */
  prescriptionFileName?: string;
  /** ISO timestamp. */
  placedAt: string;
}

const STORAGE_KEY = "medivyx:orders";
const MAX_ENTRIES = 8;

function readAll(): DeviceOrderEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is DeviceOrderEntry =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as DeviceOrderEntry).reference === "string" &&
        typeof (v as DeviceOrderEntry).total === "number" &&
        typeof (v as DeviceOrderEntry).placedAt === "string"
    );
  } catch {
    return [];
  }
}

function writeAll(list: DeviceOrderEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
  } catch {
    // storage unavailable — history simply isn't remembered
  }
}

/** Remember a just-placed order (most recent first, deduped, capped). */
export function rememberOrder(entry: DeviceOrderEntry): void {
  const list = readAll();
  const next = [entry, ...list.filter((o) => o.reference !== entry.reference)].slice(
    0,
    MAX_ENTRIES
  );
  writeAll(next);
}

/** Orders placed on this device (most recent first). */
export function listDeviceOrders(): DeviceOrderEntry[] {
  return readAll().sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

/** Forget one order (e.g. user removes it from the list). */
export function removeDeviceOrder(reference: string): void {
  writeAll(readAll().filter((o) => o.reference !== reference));
}

/** Forget the whole history. */
export function clearDeviceOrders(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // best effort
  }
}
