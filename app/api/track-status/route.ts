import { NextResponse } from "next/server";
import { findMedicineRequest, normalizeReference } from "@/lib/submissions";
import { findBooking, normalizeBookingReference } from "@/lib/bookings";
import { findOrder, normalizeOrderReference } from "@/lib/orders";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Public order-tracking lookup (research.md §8 + §24).
 * Accepts ALL reference families:
 *  - MDX-XXXX → medicine requests
 *  - BKG-XXXX → consultation bookings
 *  - ORD-XXXX → online shop orders
 * Returns a privacy-safe view — never names, phones or notes,
 * which stay in the staff dashboard only.
 */
export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`track-status:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Too many lookups.");
  }

  const ref = new URL(request.url).searchParams.get("ref") ?? "";

  // Medicine requests (MDX-XXXX)
  const requestRef = normalizeReference(ref);
  if (requestRef) {
    const rec = await findMedicineRequest(requestRef);
    if (rec) {
      return NextResponse.json(
        {
          found: true,
          type: "request" as const,
          request: {
            reference: rec.reference,
            medicine: rec.medicine,
            fulfilment: rec.fulfilment,
            status: rec.status,
            receivedAt: rec.receivedAt,
          },
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { found: false, error: `We couldn't find a request for ${requestRef}.` },
      { status: 404 }
    );
  }

  // Consultation bookings (BKG-XXXX)
  const bookingRef = normalizeBookingReference(ref);
  if (bookingRef) {
    const booking = await findBooking(bookingRef);
    if (booking) {
      return NextResponse.json(
        { found: true, type: "booking" as const, booking },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { found: false, error: `We couldn't find a booking for ${bookingRef}.` },
      { status: 404 }
    );
  }

  // Online shop orders (ORD-XXXX)
  const orderRef = normalizeOrderReference(ref);
  if (orderRef) {
    const order = await findOrder(orderRef);
    if (order) {
      return NextResponse.json(
        { found: true, type: "order" as const, order },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { found: false, error: `We couldn't find an order for ${orderRef}.` },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      found: false,
      error:
        "Please enter a reference code like ORD-V9QW (shop order), MDX-V9QW (medicine request) or BKG-W4LD (consultation booking).",
    },
    { status: 400 }
  );
}
