import { deliveryFeeFor } from "@/lib/business";

/**
 * Demo promo codes (checkout discounts).
 *
 * Codes are validated and applied SERVER-SIDE in /api/orders — the client
 * only echoes the code, so a tampered basket can't invent discounts.
 * Replace with a real promotions engine before production.
 */

export interface PromoCode {
  /** Uppercase code the customer types. */
  code: string;
  /** Short description shown when the code applies. */
  label: string;
  /** Percentage off the items subtotal (0 = not a percentage promo). */
  percentOff: number;
  /** Flat KES amount off (0 = not a flat promo). */
  amountOff: number;
  /** Minimum items subtotal for the code to apply. */
  minSubtotal: number;
  /** Caps a percentage promo (KES) so 10% can't nuke a huge basket. */
  maxDiscount: number;
  /** Frees the delivery fee (any zone, even under the threshold). */
  freeDelivery: boolean;
}

export const PROMO_CODES: readonly PromoCode[] = [
  {
    code: "WELCOME10",
    label: "10% off your first order (up to KES 500)",
    percentOff: 10,
    amountOff: 0,
    minSubtotal: 0,
    maxDiscount: 500,
    freeDelivery: false,
  },
  {
    code: "FREESHIP",
    label: "Free delivery — any zone",
    percentOff: 0,
    amountOff: 0,
    minSubtotal: 500,
    maxDiscount: 0,
    freeDelivery: true,
  },
  {
    code: "CARE200",
    label: "KES 200 off orders over KES 2,000",
    percentOff: 0,
    amountOff: 200,
    minSubtotal: 2_000,
    maxDiscount: 0,
    freeDelivery: false,
  },
];

export interface PromoResult {
  /** The matched code (normalised) or "" when none. */
  code: string;
  /** Human description for receipts/confirmations. */
  label: string;
  /** Discount in KES applied to the items subtotal. */
  discount: number;
  /** True when the promo waives the delivery fee. */
  freeDelivery: boolean;
  /** Populated when the code exists but doesn't apply. */
  error?: string;
}

/** Normalise user input (" welcome-10 " → "WELCOME10"). */
export function normalizePromoCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]+/g, "");
}

/** Find a code by its normalised form (case/space/dash-insensitive). */
export function findPromoCode(input: string): PromoCode | null {
  const code = normalizePromoCode(input);
  return PROMO_CODES.find((p) => p.code === code) ?? null;
}

/** Validate a code against a basket and compute the effective discount. */
export function evaluatePromo(
  input: string,
  itemsSubtotal: number,
  /** Delivery fee that WOULD be charged (before promo). */
  deliveryFee: number
): PromoResult | null {
  const promo = findPromoCode(input);
  if (!promo) return null;

  if (itemsSubtotal < promo.minSubtotal) {
    return {
      code: promo.code,
      label: "",
      discount: 0,
      freeDelivery: false,
      error:
        promo.minSubtotal > 0
          ? `${promo.code} needs a basket of KES ${promo.minSubtotal.toLocaleString("en-KE")} or more.`
          : "This code can't be applied.",
    };
  }

  let discount = 0;
  if (promo.percentOff > 0) {
    discount = Math.min(
      Math.round((itemsSubtotal * promo.percentOff) / 100),
      promo.maxDiscount
    );
  } else if (promo.amountOff > 0) {
    discount = Math.min(promo.amountOff, itemsSubtotal);
  }

  return {
    code: promo.code,
    label: promo.label,
    discount,
    freeDelivery: promo.freeDelivery && deliveryFee > 0,
  };
}

/** Delivery fee with promo awareness (a free-delivery promo waives it). */
export function deliveryFeeWithPromo(
  itemsSubtotal: number,
  area: string,
  promoInput: string
): { fee: number; waived: boolean } {
  const base = deliveryFeeFor(itemsSubtotal, area);
  const promo = findPromoCode(promoInput);
  if (promo?.freeDelivery && base > 0) {
    return { fee: 0, waived: true };
  }
  return { fee: base, waived: false };
}
