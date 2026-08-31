import { NextResponse } from "next/server";
import { subscribeEmail } from "@/lib/newsletter";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Public newsletter sign-up (footer "Stay well" card).
 * Demo storage only — no emails are sent; swap for a real mailing-list
 * service before production. Duplicate emails succeed silently so the
 * UI never leaks whether an address is already subscribed.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`newsletter:${ip}`, 6, 60_000)) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts — please wait a moment." },
      { status: 429 }
    );
  }

  let email = "";
  let source = "footer";
  try {
    const body = (await request.json()) as { email?: unknown; source?: unknown };
    email = typeof body.email === "string" ? body.email : "";
    if (typeof body.source === "string" && body.source.length <= 40) {
      source = body.source;
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const result = await subscribeEmail(email, source);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          result.reason === "storage"
            ? "Couldn't save right now — please try again shortly."
            : "Please enter a valid email address.",
      },
      { status: result.reason === "storage" ? 500 : 400 }
    );
  }

  return NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
