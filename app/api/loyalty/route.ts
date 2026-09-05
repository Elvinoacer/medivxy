import { NextResponse } from "next/server";
import { quoteLoyalty, pointsEarnedFor, tierForLifetime } from "@/lib/loyalty";
import { isValidKenyanPhone } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * MediPoints quote endpoint (checkout widget).
 *
 * GET ?phone=07XXXXXXXX[&total=1500]
 *   → { ok, account: { points, tier, …, previewEarn } | null }
 *
 * The quote carries no personal data beyond the balance itself — the phone
 * number is the customer's own key (same identity M-Pesa uses).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = url.searchParams.get("phone") ?? "";
  const total = Number(url.searchParams.get("total") ?? "0");

  if (!isValidKenyanPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "Provide a valid Kenyan phone (?phone=)." },
      { status: 400 }
    );
  }

  try {
    const account = await quoteLoyalty(
      phone,
      Number.isFinite(total) && total > 0 ? total : undefined
    );
    if (!account) {
      // No account yet — preview what a first order would earn (bonus incl.).
      const preview =
        Number.isFinite(total) && total > 0
          ? pointsEarnedFor(0, total, tierForLifetime(0).multiplier)
          : undefined;
      return NextResponse.json(
        { ok: true, account: null, previewEarn: preview },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { ok: true, account },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't load MediPoints right now." },
      { status: 500 }
    );
  }
}
