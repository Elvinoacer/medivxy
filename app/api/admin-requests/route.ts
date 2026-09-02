import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  isValidStatus,
  listMedicineRequests,
  updateMedicineRequestStatus,
} from "@/lib/submissions";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Staff-only medicine-request management (research.md §24).
 * GET  — list requests (full details, staff area only)
 * POST — update a request's status; feeds the public tracking page
 */

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await listMedicineRequests();
  return NextResponse.json(
    { requests },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`admin-requests:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Too many updates.");
  }

  const body: unknown = await request.json().catch(() => null);
  const reference =
    typeof (body as { reference?: unknown } | null)?.reference === "string"
      ? (body as { reference: string }).reference
      : "";
  const status = (body as { status?: unknown } | null)?.status;

  if (!isValidStatus(status)) {
    return NextResponse.json(
      { error: "Invalid status value." },
      { status: 400 }
    );
  }

  const updated = await updateMedicineRequestStatus(reference, status);
  if (!updated) {
    return NextResponse.json(
      { error: "Request not found." },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { ok: true, request: updated },
    { headers: { "Cache-Control": "no-store" } }
  );
}
