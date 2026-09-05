import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { setStockLevel } from "@/lib/stock";

export const runtime = "nodejs";

/**
 * Staff-only stock management.
 * GET  — current levels for all managed products
 * POST — { slug, level } set a product's stock level (0–999)
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { getStockLevels } = await import("@/lib/stock");
  const levels = await getStockLevels();
  return NextResponse.json(
    { levels },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`admin-stock:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Too many updates.");
  }

  const body = (await request.json().catch(() => null)) as {
    slug?: unknown;
    level?: unknown;
  } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const level = typeof body?.level === "number" ? body.level : NaN;

  if (!slug || !Number.isFinite(level)) {
    return NextResponse.json(
      { error: "Provide a product slug and a level between 0 and 999." },
      { status: 400 }
    );
  }

  const levels = await setStockLevel(slug, level);
  if (!levels) {
    return NextResponse.json(
      { error: "That product isn't stock-managed (ask-to-order item)." },
      { status: 404 }
    );
  }
  return NextResponse.json(
    { ok: true, levels },
    { headers: { "Cache-Control": "no-store" } }
  );
}
