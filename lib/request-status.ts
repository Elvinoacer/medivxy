import { findMedicineRequest, normalizeReference } from "@/lib/submissions";
import { findBooking, normalizeBookingReference, consultLabel, slotLabel } from "@/lib/bookings";
import { whatsappMessages } from "@/lib/business";
import type { ChatReply } from "@/lib/chatbot";
import type { MedicineRequestStatus } from "@/lib/types";

/**
 * Order-status detection for the chatbot: if the customer mentions a
 * reference code (MDX-XXXX medicine request or BKG-XXXX consultation
 * booking), look it up and answer with its live status instead of
 * routing through the general intents.
 */

const REFERENCE_PATTERN = /\b(?:MDX|BKG)[-\s]?[A-Z0-9]{4}\b/i;

const STATUS_SUMMARY: Record<MedicineRequestStatus, string> = {
  received: "received — the team will review it shortly",
  confirmed: "confirmed by the pharmacy team",
  ready: "being prepared for you",
  fulfilled: "completed",
};

function bookingStatusText(status: string): string {
  switch (status) {
    case "requested":
      return "awaiting team confirmation — the pharmacy will confirm the slot shortly";
    case "confirmed":
      return "confirmed";
    case "completed":
      return "completed";
    default:
      return status;
  }
}

export function statusSummary(status: MedicineRequestStatus): string {
  return STATUS_SUMMARY[status];
}

export async function maybeTrackReply(message: string): Promise<ChatReply | null> {
  const match = message.match(REFERENCE_PATTERN);
  if (!match) return null;

  const token = match[0].toUpperCase();
  const bookingRef = normalizeBookingReference(token);

  // ── Consultation booking (BKG-XXXX) ──
  if (bookingRef) {
    const booking = await findBooking(bookingRef);
    if (!booking) {
      return {
        intent: "order-status",
        text: `I couldn't find a booking with the reference ${bookingRef}. Please double-check the code (it looks like BKG-XXXX) — or ask the team on WhatsApp and they'll look it up for you.`,
        ctas: [
          { kind: "internal", label: "Track a booking", href: "/track" },
        ],
        suggestions: ["Book a consultation", "What are your opening hours?"],
      };
    }
    const when = bookingWhenText(booking.date, booking.slot);
    return {
      intent: "order-status",
      text: `Booking ${booking.reference} (${consultLabel(booking.consultType)}, ${when}) is ${bookingStatusText(booking.status)}. You can follow it on the Track page — or message the team if you need to change the time.`,
      ctas: [
        { kind: "internal", label: "Track this booking", href: `/track?ref=${booking.reference}` },
        {
          kind: "whatsapp",
          label: "Ask about this booking",
          message: `Hi Medivyx, I'd like to ask about consultation booking ${booking.reference}.`,
        },
      ],
      suggestions: ["Book a consultation", "What are your opening hours?"],
    };
  }

  // ── Medicine request (MDX-XXXX) ──
  const reference = normalizeReference(match[0]);
  const request = await findMedicineRequest(reference);

  if (!request) {
    return {
      intent: "order-status",
      text: `I couldn't find a request with the reference ${reference}. Please double-check the code (it looks like MDX-XXXX) — or ask the team on WhatsApp and they'll look it up for you.`,
      ctas: [
        { kind: "internal", label: "Track a request", href: "/track" },
      ],
      suggestions: ["How do I request medicine?", "What are your opening hours?"],
    };
  }

  const readyLabel =
    request.fulfilment === "delivery" ? "dispatched for delivery" : "ready for pickup";
  const statusText =
    request.status === "ready" ? readyLabel : STATUS_SUMMARY[request.status];
  const submitted = new Date(request.receivedAt);
  const when = Number.isNaN(submitted.getTime())
    ? ""
    : ` It was submitted on ${submitted.toDateString()}.`;

  return {
    intent: "order-status",
    text: `Request ${request.reference} (${request.medicine}) is ${statusText}.${when} You can follow its progress on the Track a Request page — or message the team if anything looks wrong.`,
    ctas: [
      { kind: "internal", label: "Track this request", href: `/track?ref=${request.reference}` },
      {
        kind: "whatsapp",
        label: "Ask about this request",
        message: whatsappMessages.request(request.reference),
      },
    ],
    suggestions: ["How do I request medicine?", "What are your opening hours?"],
  };
}

function bookingWhenText(date: string, slot: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return slotLabel(slot);
  const day = d.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${day} at ${slotLabel(slot)}`;
}
