import { NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  bookingSummary,
  logBooking,
  newBookingReference,
  validateBookingInput,
} from "@/lib/bookings";
import type { BookingFull } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Consultation booking endpoint.
 * Validates server-side (consult type, real slot for the chosen day, not in
 * the past, Kenyan phone) and appends to the demo store so staff see the
 * booking in /admin. No payment — the team confirms by phone/WhatsApp.
 */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rl = rateLimit(`booking:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return rateLimitResponse(rl.retryAfterSec, "Too many bookings.");
    }

    const body = (await request.json().catch(() => null)) as {
      consultType?: string;
      date?: string;
      slot?: string;
      fullName?: string;
      phone?: string;
      notes?: string;
    } | null;

    if (!body) {
      return NextResponse.json({ error: "Invalid booking submission." }, { status: 400 });
    }

    const input = {
      consultType: (body.consultType ?? "").toString().trim(),
      date: (body.date ?? "").toString().trim(),
      slot: (body.slot ?? "").toString().trim(),
      fullName: (body.fullName ?? "").toString().trim().slice(0, 80),
      phone: (body.phone ?? "").toString().trim(),
      notes: (body.notes ?? "").toString().trim().slice(0, 500),
    };

    const errors = validateBookingInput(input);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", fields: errors },
        { status: 400 }
      );
    }

    const reference = newBookingReference();
    const stored = await logBooking({ reference, ...input });
    if (!stored) {
      // Surface demo-store failures instead of losing the booking silently.
      return NextResponse.json(
        {
          error:
            "We received your details but couldn't save the booking right now. Please message us on WhatsApp and the team will confirm your slot.",
        },
        { status: 500 }
      );
    }

    // Human-readable summary for the confirmation card + WhatsApp message.
    const summary = bookingSummary({
      reference,
      ...input,
      status: "requested",
      receivedAt: new Date().toISOString(),
    } as BookingFull);

    return NextResponse.json({ ok: true, reference, summary });
  } catch {
    return NextResponse.json(
      { error: "Booking failed — please try again or message us on WhatsApp." },
      { status: 500 }
    );
  }
}
