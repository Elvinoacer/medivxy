import fs from "node:fs/promises";
import path from "node:path";
import { isValidKenyanPhone } from "@/lib/validation";
import {
  tierForLifetime,
  pointsEarnedFor,
  REDEEM_BLOCK,
  REDEEM_RATE_KES,
  type LoyaltyQuote,
  type LoyaltyTier,
} from "@/lib/loyalty-shared";

export {
  tierForLifetime,
  pointsEarnedFor,
  REDEEM_BLOCK,
  REDEEM_RATE_KES,
} from "@/lib/loyalty-shared";
export type { LoyaltyQuote, LoyaltyTier, TierInfo } from "@/lib/loyalty-shared";

/**
 * MediPoints — the Medivyx loyalty programme (demo).
 *
 * Points are held SERVER-SIDE against the customer's phone number (the same
 * identity M-Pesa uses), so a tampered client can't invent a balance: the
 * checkout only *asks* how many points to redeem and the orders API re-checks
 * the balance, the block rules and the cap before granting the discount.
 *
 * Rules (single source of truth — confirm real figures before production):
 *  • Earn: 1 MediPoint for every KES 100 spent (rounded down, after discounts).
 *  • First order bonus: +50 points.
 *  • Tiers by lifetime points: Friend <500 · Silver ≥500 (1.25× earn) ·
 *    Gold ≥1,500 (1.5× earn).
 *  • Redeem: in blocks of 100 points · 1 point = KES 1 off · capped at the
 *    items subtotal so a redemption can never make an order negative.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const LOYALTY_FILE = "loyalty.json";

/** Ledger rows kept per phone (bounds the demo store). */
const MAX_LEDGER_PER_PHONE = 40;

/* ── Store types ────────────────────────────────────────────────── */

interface LoyaltyAccount {
  /** Normalised phone key (see normalizeLoyaltyPhone). */
  phone: string;
  /** Redeemable points balance. */
  points: number;
  /** Lifetime points earned (never decreases — sets the tier). */
  lifetimePoints: number;
  /** Number of orders that earned points. */
  orders: number;
  updatedAt: string; // ISO
}

export type LedgerReason = "earn" | "bonus" | "redeem";

export interface LedgerEntry {
  phone: string;
  /** Order reference the entry belongs to. */
  ref: string;
  /** Signed point change (earn/bonus positive, redeem negative). */
  delta: number;
  reason: LedgerReason;
  at: string; // ISO
}

interface LoyaltyStore {
  accounts: LoyaltyAccount[];
  ledger: LedgerEntry[];
}

/* ── Atomic JSON store helpers (mirrors lib/orders.ts) ──────────── */

async function atomicWriteJson(data: LoyaltyStore): Promise<boolean> {
  const target = path.join(DATA_DIR, LOYALTY_FILE);
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, target);
    return true;
  } catch {
    try {
      await fs.rm(tmp, { force: true });
    } catch {
      // best-effort cleanup only
    }
    return false;
  }
}

async function readStore(): Promise<LoyaltyStore> {
  try {
    const raw = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, LOYALTY_FILE), "utf8")
    );
    if (Array.isArray(raw)) {
      // Tolerate an older file shape: accounts-only array.
      return { accounts: raw as LoyaltyAccount[], ledger: [] };
    }
    if (
      typeof raw === "object" &&
      raw !== null &&
      Array.isArray((raw as LoyaltyStore).accounts)
    ) {
      const store = raw as LoyaltyStore;
      return {
        accounts: store.accounts,
        ledger: Array.isArray(store.ledger) ? store.ledger : [],
      };
    }
    return { accounts: [], ledger: [] };
  } catch {
    return { accounts: [], ledger: [] };
  }
}

async function writeStore(store: LoyaltyStore): Promise<boolean> {
  return atomicWriteJson(store);
}

/* ── Phone normalisation ────────────────────────────────────────── */

/**
 * Normalise a Kenyan mobile number to the storage key form "07XXXXXXXX" so
 * "0712 345 678", "+254712345678" and "254712345678" all hit one account.
 * Returns "" when the input can't be a Kenyan mobile.
 */
export function normalizeLoyaltyPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("254")) local = `0${local.slice(3)}`;
  if (local.startsWith("0") && local.length === 10) return local;
  if (local.length === 9 && !local.startsWith("0")) return `0${local}`;
  return "";
}

/* ── Public quote (checkout widget + track page) ────────────────── */

function toQuote(acct: LoyaltyAccount): LoyaltyQuote {
  const t = tierForLifetime(acct.lifetimePoints);
  return {
    phone: acct.phone,
    points: acct.points,
    lifetimePoints: acct.lifetimePoints,
    tier: t.tier,
    tierLabel: t.label,
    multiplier: t.multiplier,
    nextAt: t.nextAt,
    nextLabel: t.nextLabel,
    orders: acct.orders,
  };
}

/** Balance + tier for a phone (null when the number has no account yet). */
export async function quoteLoyalty(
  input: string,
  orderTotalForPreview?: number
): Promise<LoyaltyQuote | null> {
  const phone = normalizeLoyaltyPhone(input);
  if (!phone || !isValidKenyanPhone(phone)) return null;
  const store = await readStore();
  const acct = store.accounts.find((a) => a.phone === phone);
  if (!acct) return null;
  const quote = toQuote(acct);
  if (typeof orderTotalForPreview === "number") {
    quote.previewEarn = pointsEarnedFor(acct.orders, orderTotalForPreview, quote.multiplier);
  }
  return quote;
}

/* ── Earning / redemption ───────────────────────────────────────── */

export interface RedemptionCheck {
  ok: boolean;
  /** KES discount the redemption grants (0 when not ok). */
  kes: number;
  error?: string;
}

/**
 * Validate a redemption request against the account + basket rules.
 * The orders API calls this BEFORE writing the order — same "server is the
 * source of truth" philosophy as prices, fees and promo codes.
 */
export async function checkRedemption(
  phoneInput: string,
  pointsRequested: number,
  /** Maximum KES the redemption may cover (items subtotal − promo discount). */
  maxKes: number
): Promise<RedemptionCheck> {
  if (!Number.isFinite(pointsRequested) || pointsRequested <= 0) {
    return { ok: false, kes: 0 };
  }
  if (pointsRequested % REDEEM_BLOCK !== 0) {
    return {
      ok: false,
      kes: 0,
      error: `Points are redeemed in blocks of ${REDEEM_BLOCK}.`,
    };
  }
  const phone = normalizeLoyaltyPhone(phoneInput);
  const quote = phone ? await quoteLoyalty(phone) : null;
  if (!quote) {
    return {
      ok: false,
      kes: 0,
      error: "No MediPoints account found for that phone number yet.",
    };
  }
  if (quote.points < pointsRequested) {
    return {
      ok: false,
      kes: 0,
      error: `You have ${quote.points} MediPoints — you asked to use ${pointsRequested}.`,
    };
  }
  const kes = Math.min(pointsRequested * REDEEM_RATE_KES, maxKes);
  if (kes <= 0) {
    return {
      ok: false,
      kes: 0,
      error: "Your promo discount already covers the basket — save the points for another order.",
    };
  }
  return { ok: true, kes };
}

export interface LoyaltyApplication {
  /** Points earned by this order (bonus included, tier multiplier applied). */
  earned: number;
  /** Points redeemed by this order (0 when none). */
  redeemed: number;
  /** Points subtracted from the balance in KES (`redeemed × REDEEM_RATE_KES`, capped). */
  redeemedKes: number;
  /** New redeemable balance after the order. */
  balance: number;
  tier: LoyaltyTier;
  tierLabel: string;
}

/**
 * Post-order bookkeeping: redeem the requested points (already validated),
 * then earn for the new total. Appends ledger rows; creates the account on
 * a customer's first order (which also triggers the first-order bonus).
 */
export async function applyLoyalty(
  phoneInput: string,
  ref: string,
  orderTotal: number,
  pointsToRedeem: number,
  redeemedKes: number
): Promise<LoyaltyApplication | null> {
  const phone = normalizeLoyaltyPhone(phoneInput);
  if (!phone) return null;
  const store = await readStore();
  const idx = store.accounts.findIndex((a) => a.phone === phone);
  const existing = idx >= 0 ? store.accounts[idx] : null;
  const tier = existing ? tierForLifetime(existing.lifetimePoints) : tierForLifetime(0);

  const redeemed = Math.max(0, Math.floor(pointsToRedeem));
  const earned = pointsEarnedFor(existing?.orders ?? 0, orderTotal, tier.multiplier);

  const account: LoyaltyAccount = {
    phone,
    points: Math.max(0, (existing?.points ?? 0) - redeemed) + earned,
    lifetimePoints: (existing?.lifetimePoints ?? 0) + earned,
    orders: (existing?.orders ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  if (existing) store.accounts[idx] = account;
  else store.accounts.push(account);

  const entries: LedgerEntry[] = [];
  if (redeemed > 0) {
    entries.push({ phone, ref, delta: -redeemed, reason: "redeem", at: account.updatedAt });
  }
  if (earned > 0) {
    entries.push({ phone, ref, delta: earned, reason: "earn", at: account.updatedAt });
  }
  const keptLedger = store.ledger.filter((l) => l.phone !== phone);
  const mine = store.ledger.filter((l) => l.phone === phone);
  store.ledger = [
    ...keptLedger,
    ...mine.slice(-MAX_LEDGER_PER_PHONE),
    ...entries,
  ];

  const finalTier = tierForLifetime(account.lifetimePoints);
  const result: LoyaltyApplication = {
    earned,
    redeemed,
    redeemedKes: Math.max(0, redeemedKes),
    balance: account.points,
    tier: finalTier.tier,
    tierLabel: finalTier.label,
  };
  if (!(await writeStore(store))) return null;
  return result;
}

/* ── Staff view (admin dashboard) ───────────────────────────────── */

export interface LoyaltyAccountView extends LoyaltyQuote {
  updatedAt: string;
}

export async function listLoyaltyAccounts(): Promise<LoyaltyAccountView[]> {
  const store = await readStore();
  return store.accounts
    .map((a) => ({ ...toQuote(a), updatedAt: a.updatedAt }))
    .sort((a, b) => b.lifetimePoints - a.lifetimePoints);
}
