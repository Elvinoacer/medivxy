import { business, hoursForDate } from "@/lib/business";
import type { BookingFull, BookingStatus } from "@/lib/types";

export type { BookingFull, BookingStatus };

/**
 * Client-safe booking helpers (pure — no filesystem).
 * Shared by the booking form, the staff dashboard and the server store
 * in `lib/bookings.ts` (which owns the demo persistence).
 */

/* ── Bookable consultation types (domain-informed) ── */

export interface ConsultType {
  id: string;
  label: string;
  description: string;
  duration: string;
  /** Event length in minutes (used for calendar exports). */
  durationMinutes: number;
}

export const CONSULT_TYPES: ConsultType[] = [
  {
    id: "pharmacist-chat",
    label: "Talk to a pharmacist",
    description: "A private chat about your medicines, dosage or side effects.",
    duration: "≈ 15 min",
    durationMinutes: 15,
  },
  {
    id: "prescription-review",
    label: "Prescription review",
    description: "Bring your prescription — we review it and prepare your medicines.",
    duration: "≈ 20 min",
    durationMinutes: 20,
  },
  {
    id: "bp-check",
    label: "Blood pressure check",
    description: "A quick BP measurement with guidance on the readings.",
    duration: "≈ 10 min",
    durationMinutes: 10,
  },
  {
    id: "wellness-advice",
    label: "Health & wellness advice",
    description: "Everyday advice on nutrition, supplements and family care.",
    duration: "≈ 15 min",
    durationMinutes: 15,
  },
];

export function consultLabel(id: string): string {
  return CONSULT_TYPES.find((c) => c.id === id)?.label ?? id;
}

/** Consultation length in minutes (calendar-friendly, defaults to 15). */
export function consultMinutes(id: string): number {
  return CONSULT_TYPES.find((c) => c.id === id)?.durationMinutes ?? 15;
}

/* ── Slot generation (single source of truth: business.hours) ── */

/** Bookable hour slots for a date, derived from that day's opening hours.
 *  Slots run from opening hour to one hour before closing. */
export function slotsForDate(date: Date): string[] {
  const { open, close } = hoursForDate(date);
  const openMin = parseToMinutes(open);
  const closeMin = parseToMinutes(close);
  const slots: string[] = [];
  // Bookings start on the hour; last slot starts an hour before closing.
  for (let m = openMin; m <= closeMin - 60; m += 60) {
    const h = Math.floor(m / 60);
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

/** Slot label for display, e.g. "09:00" → "9:00 AM". */
export function slotLabel(slot: string): string {
  const [hStr, mStr] = slot.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

/** Part of day for grouping slots in the picker. */
export function slotPeriod(slot: string): "Morning" | "Afternoon" | "Evening" {
  const h = Number(slot.split(":")[0]);
  if (h < 12) return "Morning";
  if (h < 16) return "Afternoon";
  return "Evening";
}

function parseToMinutes(time: string): number {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (/PM/i.test(match[3]) && hour !== 12) hour += 12;
  if (/AM/i.test(match[3]) && hour === 12) hour = 0;
  return hour * 60 + minute;
}

/** Human summary used by WhatsApp confirmations + admin rows.
 *  Accepts any record with the three fields it reads (works for both
 *  BookingFull and the privacy-safe BookingPublic on the tracking page). */
export function bookingSummary(
  b: Pick<BookingFull, "date" | "slot" | "consultType">
): string {
  const d = new Date(`${b.date}T00:00:00`);
  const day = d.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day} at ${slotLabel(b.slot)} (${consultLabel(b.consultType)})`;
}

/** Validation of booking input shape (shared client/server).
 *  Date/slot realism beyond the regex is checked server-side too. */
export function validateBookingInput(input: {
  consultType: string;
  date: string;
  slot: string;
  fullName: string;
  phone: string;
  notes: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!CONSULT_TYPES.some((c) => c.id === input.consultType))
    errors.consultType = "Please choose a consultation type.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    errors.date = "Please choose a valid date.";
  if (!/^\d{2}:\d{2}$/.test(input.slot))
    errors.slot = "Please choose a time slot.";
  if (input.fullName.trim().length < 2 || input.fullName.length > 80)
    errors.fullName = "Please enter your full name.";
  if (!/^(?:\+?254|0)\d{9}$/.test(input.phone.replace(/\s+/g, "")))
    errors.phone = "Please enter a valid Kenyan phone number.";
  if (input.notes.length > 500) errors.notes = "Notes are too long.";
  if (Object.keys(errors).length > 0) return errors;

  // Date/slot must be a real bookable slot for that weekday and not in the past.
  const [y, m, d] = input.date.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (Number.isNaN(date.getTime()) || date < startOfToday)
    errors.date = "Please choose today or a future date.";
  // 14 days (today + 13) — matches the day strip in the booking form.
  const maxDate = new Date(startOfToday.getTime() + 13 * 24 * 60 * 60 * 1000);
  if (date > maxDate) errors.date = "Bookings are limited to the next 14 days.";
  if (!errors.slot && !slotsForDate(date).includes(input.slot))
    errors.slot = "That time is outside opening hours for the chosen day.";
  if (!errors.slot && !errors.date) {
    const [sh] = input.slot.split(":").map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(sh, 0, 0, 0);
    if (slotDateTime.getTime() <= Date.now())
      errors.slot = "That time has already passed — please pick a later slot.";
  }
  return errors;
}

/* ── Calendar export helpers (client-safe, pure) ── */

/** Format a local EAT (UTC+3) date+slot as a UTC iCalendar stamp, e.g.
 *  "2026-09-01" + "10:00" → "20260901T070000Z" (Nairobi has no DST). */
function eatUtcStamp(date: string, slot: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = slot.split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, h - 3, min));
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${utc.getUTCFullYear()}${p(utc.getUTCMonth() + 1)}${p(utc.getUTCDate())}` +
    `T${p(utc.getUTCHours())}${p(utc.getUTCMinutes())}00Z`
  );
}

export interface BookingCalendarLinks {
  googleUrl: string;
  icsHref: string;
  icsFilename: string;
}

/** Build "Add to calendar" links for a tracked booking:
 *  a Google Calendar template URL and a downloadable .ics data URI. */
export function bookingCalendarLinks(booking: {
  reference: string;
  consultType: string;
  date: string;
  slot: string;
}): BookingCalendarLinks {
  const label = consultLabel(booking.consultType);
  const minutes = consultMinutes(booking.consultType);
  // Nairobi EAT is a fixed UTC+3 — convert both stamps so every calendar
  // shows the right time regardless of the viewer's timezone.
  const startUtc = eatUtcStamp(booking.date, booking.slot);
  const [y, m, d] = booking.date.split("-").map(Number);
  const [h, min] = booking.slot.split(":").map(Number);
  const endUtc = new Date(Date.UTC(y, m - 1, d, 0, h * 60 + min + minutes - 180));
  const p = (n: number) => String(n).padStart(2, "0");
  const endUtcStamp =
    `${endUtc.getUTCFullYear()}${p(endUtc.getUTCMonth() + 1)}${p(endUtc.getUTCDate())}` +
    `T${p(endUtc.getUTCHours())}${p(endUtc.getUTCMinutes())}00Z`;

  const summary = `${label} — ${business.name}`;
  const details = `Consultation booking ${booking.reference} at ${business.name}. Reference code: ${booking.reference}. Arrive a few minutes early.`;
  const location = `${business.area}, ${business.city}`;

  const googleUrl =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(summary)}` +
    `&dates=${startUtc}/${endUtcStamp}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}`;

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Medivyx Medical Care//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${booking.reference}@medivyx.demo`,
    `DTSTAMP:${startUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtcStamp}`,
    `SUMMARY:${summary.replace(/[,;]/g, " ")}`,
    `DESCRIPTION:${details.replace(/[,;]/g, " ")}`,
    `LOCATION:${location.replace(/[,;]/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    googleUrl,
    icsHref: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
    icsFilename: `medivyx-consultation-${booking.reference.toLowerCase()}.ics`,
  };
}
