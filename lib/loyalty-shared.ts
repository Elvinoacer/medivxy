/**
 * MediPoints rules — CLIENT-SAFE (no node:fs).
 *
 * Shared by the checkout widget (display/preview math) and the server store
 * (lib/loyalty.ts — the authoritative balances). Mirrors the
 * lib/booking-shared.ts pattern: keep this file free of node-only imports.
 */

export const POINTS_EARN_PER_KES = 100; // 1 point per KES 100 spent
export const FIRST_ORDER_BONUS = 50;
export const REDEEM_BLOCK = 100; // points are redeemed in blocks of 100
export const REDEEM_RATE_KES = 1; // 1 point = KES 1 off

/* ── Tier ladder ────────────────────────────────────────────────── */

export type LoyaltyTier = "friend" | "silver" | "gold";

export interface TierInfo {
  tier: LoyaltyTier;
  label: string;
  /** Earn multiplier for the tier (Friend 1×, Silver 1.25×, Gold 1.5×). */
  multiplier: number;
  /** Lifetime points needed for the NEXT tier (null at Gold). */
  nextAt: number | null;
  nextLabel: string | null;
}

export function tierForLifetime(lifetime: number): TierInfo {
  if (lifetime >= 1_500) {
    return { tier: "gold", label: "Gold", multiplier: 1.5, nextAt: null, nextLabel: null };
  }
  if (lifetime >= 500) {
    return { tier: "silver", label: "Silver", multiplier: 1.25, nextAt: 1_500, nextLabel: "Gold" };
  }
  return { tier: "friend", label: "Friend", multiplier: 1, nextAt: 500, nextLabel: "Silver" };
}

/** Points earned for an order (priorOrders triggers the first-order bonus). */
export function pointsEarnedFor(
  priorOrders: number,
  orderTotal: number,
  multiplier: number
): number {
  const base = Math.floor(Math.max(0, orderTotal) / POINTS_EARN_PER_KES);
  const earned = Math.floor(base * multiplier);
  return priorOrders === 0 ? earned + FIRST_ORDER_BONUS : earned;
}

/** Public quote shape returned by /api/loyalty (no personal data). */
export interface LoyaltyQuote {
  phone: string;
  points: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierLabel: string;
  multiplier: number;
  nextAt: number | null;
  nextLabel: string | null;
  orders: number;
  /** Points this order would earn (preview, computed server-side). */
  previewEarn?: number;
}
