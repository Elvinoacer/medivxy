/**
 * Shared field validation (client + server).
 *
 * One source of truth for the formats the demo forms agree on, so the
 * client-side hint and the server-side check can never drift apart.
 * Previously the medicine-request form, booking form, contact form and
 * API routes each carried their own slightly-different phone regex.
 */

/** Kenyan mobiles: 07XXXXXXXX, 01XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX… */
export const KENYA_PHONE_RE = /^(?:\+?254|0)\d{9}$/;

/** Normalise whitespace before testing ("07xx xxx xxx" → "07xxxxxxxxxx"). */
export function isValidKenyanPhone(raw: string): boolean {
  return KENYA_PHONE_RE.test(raw.replace(/\s+/g, "").trim());
}

export const PHONE_HINT = "e.g. 07XX XXX XXX or +254 7XX XXX XXX";

/** Field lengths shared by the request wizard UI + API validation. */
export const LENGTHS = {
  medicine: { min: 3, max: 500 },
  notes: { max: 1000 },
  bookingNotes: { max: 500 },
  fullName: { min: 2, max: 80 },
  contactMessage: { min: 10, max: 2000 },
} as const;
