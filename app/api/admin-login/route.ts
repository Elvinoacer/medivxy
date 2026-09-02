import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, adminDemoPasscode, isAdmin, makeAdminSessionToken } from "@/lib/admin-auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Demo staff-area login (research.md §24 "admin-ready").
 * One demo passcode → short-lived httpOnly cookie. Replace with real
 * accounts before production.
 */

export async function GET() {
  return NextResponse.json(
    { authenticated: await isAdmin() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`admin-login:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Too many attempts.");
  }

  const body: unknown = await request.json().catch(() => null);
  const passcode =
    typeof (body as { passcode?: unknown } | null)?.passcode === "string"
      ? (body as { passcode: string }).passcode
      : "";

  if (passcode !== adminDemoPasscode()) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, makeAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
