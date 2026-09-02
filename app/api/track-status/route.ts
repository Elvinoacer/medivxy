import { NextResponse } from "next/server";
import { findMedicineRequest, normalizeReference } from "@/lib/submissions";
import { findBooking, normalizeBookingReference } from "@/lib/bookings";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Public order-tracking lookup (research.md §8 + §24).
 * Accepts BOTH reference families:
 *  - MDX-XXXX → medicine requests
 *  - BKG-XXXX → consultation bookings
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

  return NextResponse.json(
    {
      found: false,
      error:
        "Please enter a reference code like MDX-V9QW (medicine request) or BKG-W4LD (consultation booking).",
    },
    { status: 400 }
  );
}
