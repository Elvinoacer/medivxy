import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listLoyaltyAccounts } from "@/lib/loyalty";

export const runtime = "nodejs";

/**
 * Staff-only MediPoints overview.
 * GET — loyalty accounts sorted by lifetime points (top members first).
 *
 * Balances are SERVER-SIDE and phone-keyed; this is the read-only staff view
 * of the same store the checkout redeems from.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accounts = await listLoyaltyAccounts();
  return NextResponse.json(
    { accounts },
    { headers: { "Cache-Control": "no-store" } }
  );
}
