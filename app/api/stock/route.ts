import { NextResponse } from "next/server";
import { getStockLevels, LOW_STOCK_THRESHOLD } from "@/lib/stock";

export const runtime = "nodejs";

/**
 * Public stock levels — powers "Only N left" chips on catalogue cards.
 * Levels are public information; updates happen through /api/admin-stock.
 */
export async function GET() {
  try {
    const levels = await getStockLevels();
    return NextResponse.json(
      { ok: true, levels, lowThreshold: LOW_STOCK_THRESHOLD },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Couldn't load stock levels." },
      { status: 500 }
    );
  }
}
