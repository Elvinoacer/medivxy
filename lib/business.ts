/**
 * Central business configuration for Medivyx Medical Care.
 *
 * ⚠️ DEMO NOTE: contact details, hours and exact location below are
 * placeholders for the demo. Replace the values in this single file once
 * the business confirms them — everything across the site updates
 * automatically (NAP consistency, WhatsApp links, chatbot knowledge base).
 */

export const business = {
  name: "Medivyx Medical Care",
  shortName: "Medivyx",
  tagline: "Healthcare that’s closer to you.",
  description:
    "Quality pharmacy, healthcare products and everyday medical support for you and your family.",
  area: "Roysambu",
  city: "Nairobi",
  country: "Kenya",
  locationConfirmed: true, // set to false until the business confirms the exact address

  // Replace with confirmed details before production
  phone: "+254 700 000 000",
  phoneHref: "tel:+254700000000",
  whatsappNumber: "254700000000",
  whatsappDisplay: "+254 700 000 000",
  email: "hello@medivyx.co.ke",

  hours: [
    { day: "Monday – Friday", open: "8:00 AM", close: "8:00 PM" },
    { day: "Saturday", open: "8:00 AM", close: "6:00 PM" },
    { day: "Sunday", open: "10:00 AM", close: "4:00 PM" },
  ],
  hoursNote: "Hours are indicative for the demo — confirm before publishing.",

  mapsSearchUrl:
    "https://www.google.com/maps/search/?api=1&query=Roysambu%2C%20Nairobi",
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=Roysambu%2C%20Nairobi",

  // Placeholder coordinates for the demo map (Roysambu area)
  mapCoordinates: { lat: -1.2212, lng: 36.8903 },
} as const;

export const site = {
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://medivyx-medical-care.vercel.app",
  title: "Medivyx Medical Care | Pharmacy & Healthcare in Roysambu",
  seoDescription:
    "Medivyx Medical Care provides pharmacy services, healthcare products and convenient medical support for individuals and families in Roysambu, Nairobi.",
  keywords: [
    "pharmacy Roysambu",
    "pharmacy near me",
    "medicine Roysambu",
    "Medivyx",
    "healthcare products Nairobi",
    "prescription Kenya",
    "medical supplies Roysambu",
  ],
} as const;

/** Build a WhatsApp deep-link with an optional pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${business.whatsappNumber}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/* ── Opening-hours helpers (single source of truth: business.hours) ── */

/** Hours row that applies to a given date (0 = Sunday … 6 = Saturday). */
export function hoursForDate(date: Date) {
  const day = date.getDay();
  if (day === 0) return business.hours[2];
  if (day === 6) return business.hours[1];
  return business.hours[0];
}

/** Parse "8:00 AM" / "6:00 PM" into minutes since midnight. */
function toMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (/PM/i.test(match[3]) && hour !== 12) hour += 12;
  if (/AM/i.test(match[3]) && hour === 12) hour = 0;
  return hour * 60 + minute;
}

/** Whether the pharmacy is open at the given moment. */
export function isOpenAt(date: Date): boolean {
  const { open, close } = hoursForDate(date);
  const now = date.getHours() * 60 + date.getMinutes();
  return now >= toMinutes(open) && now < toMinutes(close);
}

/** Context-aware WhatsApp messages (research.md §11). */
export const whatsappMessages = {
  general: "Hi Medivyx, I have a question about your pharmacy services.",
  product: (name: string) =>
    `Hi Medivyx, I'd like to ask about the availability of ${name}.`,
  prescription:
    "Hi Medivyx, I'd like to submit a prescription for review.",
  directions:
    "Hi, please send me directions to Medivyx Medical Care.",
  request: (ref: string) =>
    `Hi Medivyx, I just submitted medicine request ${ref}.`,
  booking: (ref: string, summary: string) =>
    `Hi Medivyx, I just booked a consultation (${ref}) for ${summary}. Please confirm the slot.`,
  order: (ref: string, summary: string) =>
    `Hi Medivyx, I just placed order ${ref} (${summary}) on the website. Please confirm it.`,
} as const;

/* ── Delivery zones (checkout fee table — single source of truth) ── */

export interface DeliveryZone {
  /** Select-option value + the `area` string stored on the order. */
  name: string;
  /** Fee in KES for this zone (before the free-delivery threshold). */
  fee: number;
  /** Human ETA label shown in the picker and fee table. */
  eta: string;
}

/** Delivery zones around Roysambu — used by the checkout area picker, the
 *  fee table, and server-side re-pricing (client can't invent fees). */
export const deliveryZones: readonly DeliveryZone[] = [
  { name: "Roysambu / TRM area", fee: 150, eta: "Under 1 hour" },
  { name: "Kasarani", fee: 200, eta: "1–2 hours" },
  { name: "Githurai 44 / 45", fee: 250, eta: "1–2 hours" },
  { name: "Kahawa West / Wendani", fee: 250, eta: "1–2 hours" },
  { name: "Ruaraka / Baba Dogo", fee: 300, eta: "2–3 hours" },
  { name: "Other nearby areas", fee: 0, eta: "Fee confirmed by phone" },
];

/** Orders at or above this subtotal ship free (classic basket incentive). */
export const FREE_DELIVERY_OVER = 3_000;

/** Zone lookup by the stored area string (null when unknown/empty). */
export function findDeliveryZone(name: string): DeliveryZone | null {
  const n = name.trim().toLowerCase();
  return deliveryZones.find((z) => z.name.toLowerCase() === n) ?? null;
}

/** Delivery fee for an order — free at/above the threshold, 0 when the zone
 *  fee is "confirmed by phone" (Other), 0 for unknown areas and pickup. */
export function deliveryFeeFor(subtotal: number, area: string): number {
  if (subtotal >= FREE_DELIVERY_OVER) return 0;
  return findDeliveryZone(area)?.fee ?? 0;
}
