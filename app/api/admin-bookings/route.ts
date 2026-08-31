import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  isValidBookingStatus,
  listBookings,
  updateBookingStatus,
} from "@/lib/bookings";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Staff-only consultation-booking management.
 * GET  — list bookings (full details, staff area only)
 * POST — advance a booking's status (requested → confirmed → completed)
 */

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bookings = await listBookings();
  return NextResponse.json(
    { bookings },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`admin-bookings:${ip}`, 60, 60_000)) {
    return NextResponse.json(
      { error: "Too many updates — please slow down." },
      { status: 429 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const reference =
    typeof (body as { reference?: unknown } | null)?.reference === "string"
      ? (body as { reference: string }).reference
      : "";
  const status = (body as { status?: unknown } | null)?.status;

  if (!isValidBookingStatus(status)) {
    return NextResponse.json(
      { error: "Invalid status value." },
      { status: 400 }
    );
  }

  const updated = await updateBookingStatus(reference, status);
  if (!updated) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json(
    { ok: true, booking: updated },
    { headers: { "Cache-Control": "no-store" } }
  );
}
