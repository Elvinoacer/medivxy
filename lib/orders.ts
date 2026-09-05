import fs from "node:fs/promises";
import path from "node:path";
import { makeReference } from "@/lib/utils";
import type { OrderFull, OrderItem, OrderPublic, OrderStatus } from "@/lib/types";

export type { OrderFull, OrderItem, OrderPublic, OrderStatus };

/**
 * Online-order store for the shop/checkout demo.
 *
 * Follows the same atomic-write pattern as lib/submissions.ts so a crash can
 * never truncate the store. Swap for a real database before production.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = "orders.json";

const VALID_STATUSES: OrderStatus[] = [
  "received",
  "reviewing",
  "preparing",
  "ready",
  "completed",
];

/* ── Atomic JSON store helpers ─────────────────────────────────── */

async function atomicWriteJson(file: string, data: unknown): Promise<boolean> {
  const target = path.join(DATA_DIR, file);
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

async function readJsonArray(file: string): Promise<unknown[]> {
  try {
    const list = JSON.parse(await fs.readFile(path.join(DATA_DIR, file), "utf8"));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/* ── Demo seed ──
 * ORD-DEMO is seeded once so the tracking page demo chip for orders resolves
 * out of the box (mirrors MDX-DEMO / BKG-DEMO). */
const DEMO_ORDER_REF = "ORD-DEMO";

async function ensureDemoSeed(): Promise<void> {
  try {
    await fs.access(path.join(DATA_DIR, ORDERS_FILE));
    return;
  } catch {
    const demo: StoredOrder = {
      reference: DEMO_ORDER_REF,
      items: [
        {
          slug: "paracetamol-500mg-tablets",
          name: "Paracetamol 500mg Tablets",
          category: "Medicines",
          unitPrice: 150,
          quantity: 2,
          prescriptionRequired: false,
          image: "/images/products/paracetamol-500mg-tablets.webp",
          packSize: "Pack of 20 tablets",
        },
        {
          slug: "oral-rehydration-salts",
          name: "ORS — Oral Rehydration Salts",
          category: "Medicines",
          unitPrice: 60,
          quantity: 4,
          prescriptionRequired: false,
          image: "/images/products/oral-rehydration-salts.webp",
          packSize: "Single sachet",
        },
      ],
      total: 0, // computed below (items + delivery fee)
      fullName: "Demo Customer",
      phone: "+254 700 000 000",
      email: "",
      address: "TRM Drive, near the Roysambu roundabout",
      area: "Roysambu / TRM area",
      notes: "Seeded demo order so the ORD-DEMO tracking chip resolves.",
      prescriptionFileName: "",
      deliveryFee: 200,
      discount: 0,
      promoCode: "",
      fulfilment: "delivery",
      paymentMethod: "mpesa",
      paymentStatus: "paid-demo",
      status: "preparing",
      placedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    };
    // Demo seed total includes its delivery fee (Roysambu zone).
    const demoFee = demo.deliveryFee ?? 0;
    demo.total = demo.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) + demoFee;
    await atomicWriteJson(ORDERS_FILE, [demo]);
  }
}

/* ── Types & mapping ───────────────────────────────────────────── */

interface StoredOrder {
  reference: string;
  items: OrderItem[];
  total: number;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  notes: string;
  prescriptionFileName: string;
  /** Delivery fee in KES (0 for pickup) — computed server-side from the zone. */
  deliveryFee?: number;
  /** Promo discount in KES (0 when none). */
  discount?: number;
  /** Applied promo code ("" when none). */
  promoCode?: string;
  /** MediPoints discount in KES (0 when none). */
  loyaltyDiscount?: number;
  /** MediPoints redeemed by this order (0 when none). */
  pointsRedeemed?: number;
  /** MediPoints earned by this order (0 when unknown/legacy). */
  pointsEarned?: number;
  fulfilment: string;
  paymentMethod: string;
  paymentStatus: string;
  status?: string;
  placedAt: string;
}

function statusOf(rec: StoredOrder): OrderStatus {
  const s = rec.status;
  return typeof s === "string" && (VALID_STATUSES as string[]).includes(s)
    ? (s as OrderStatus)
    : "received";
}

function toFull(rec: StoredOrder): OrderFull {
  return {
    reference: rec.reference,
    items: rec.items ?? [],
    itemCount: (rec.items ?? []).reduce((n, i) => n + i.quantity, 0),
    total: rec.total,
    deliveryFee: rec.deliveryFee ?? 0,
    discount: rec.discount ?? 0,
    promoCode: rec.promoCode ?? "",
    loyaltyDiscount: rec.loyaltyDiscount ?? 0,
    pointsRedeemed: rec.pointsRedeemed ?? 0,
    pointsEarned: rec.pointsEarned ?? 0,
    fulfilment: rec.fulfilment === "delivery" ? "delivery" : "pickup",
    paymentMethod:
      rec.paymentMethod === "mpesa" || rec.paymentMethod === "card"
        ? rec.paymentMethod
        : "on-collection",
    paymentStatus: rec.paymentStatus === "paid-demo" ? "paid-demo" : "pending",
    hasPrescriptionItems: (rec.items ?? []).some((i) => i.prescriptionRequired),
    status: statusOf(rec),
    placedAt: rec.placedAt,
    fullName: rec.fullName,
    phone: rec.phone,
    email: rec.email ?? "",
    address: rec.address ?? "",
    area: rec.area ?? "",
    notes: rec.notes ?? "",
    prescriptionFileName: rec.prescriptionFileName ?? "",
  };
}

function toPublic(rec: StoredOrder): OrderPublic {
  const full = toFull(rec);
  // Catalogue item details (name/photo/price) are public store data — the
  // customer's own contact details are what stay staff-only.
  return {
    reference: full.reference,
    items: full.items,
    itemCount: full.itemCount,
    total: full.total,
    deliveryFee: full.deliveryFee,
    discount: full.discount,
    promoCode: full.promoCode,
    loyaltyDiscount: full.loyaltyDiscount,
    pointsRedeemed: full.pointsRedeemed,
    pointsEarned: full.pointsEarned,
    fulfilment: full.fulfilment,
    paymentMethod: full.paymentMethod,
    paymentStatus: full.paymentStatus,
    hasPrescriptionItems: full.hasPrescriptionItems,
    status: full.status,
    placedAt: full.placedAt,
  };
}

/* ── Public API ────────────────────────────────────────────────── */

export interface CreateOrderInput {
  items: OrderItem[];
  fullName: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  notes: string;
  prescriptionFileName: string;
  /** Delivery fee in KES — the API computes this server-side from the zone. */
  deliveryFee: number;
  /** Promo discount in KES — server-validated. */
  discount: number;
  /** Applied promo code ("" when none). */
  promoCode: string;
  /** MediPoints to redeem (validated server-side against the phone balance). */
  pointsToRedeem: number;
  /** MediPoints KES discount — server-computed (client can't invent it). */
  loyaltyDiscount: number;
  /** MediPoints redeemed by this order (bookkept post-order). */
  pointsRedeemed: number;
  /** MediPoints earned by this order (bookkept post-order). */
  pointsEarned: number;
  fulfilment: "pickup" | "delivery";
  paymentMethod: "mpesa" | "card" | "on-collection";
}

/** Creates an order and returns the full record (or null on write failure). */
export async function createOrder(input: CreateOrderInput): Promise<OrderFull | null> {
  await ensureDemoSeed();
  const list = (await readJsonArray(ORDERS_FILE)) as StoredOrder[];
  const itemsSubtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = Math.max(
    0,
    itemsSubtotal + input.deliveryFee - input.discount - input.loyaltyDiscount
  );
  const hasRx = input.items.some((i) => i.prescriptionRequired);
  const paid = input.paymentMethod !== "on-collection" && !hasRx;
  const rec: StoredOrder = {
    reference: makeReference("ORD"),
    items: input.items,
    total,
    fullName: input.fullName,
    phone: input.phone,
    email: input.email,
    address: input.fulfilment === "delivery" ? input.address : "",
    area: input.fulfilment === "delivery" ? input.area : "",
    notes: input.notes,
    prescriptionFileName: input.prescriptionFileName,
    deliveryFee: input.fulfilment === "delivery" ? input.deliveryFee : 0,
    discount: input.discount,
    promoCode: input.promoCode,
    loyaltyDiscount: input.loyaltyDiscount,
    pointsRedeemed: input.pointsRedeemed,
    pointsEarned: input.pointsEarned,
    fulfilment: input.fulfilment,
    paymentMethod: input.paymentMethod,
    paymentStatus: paid ? "paid-demo" : "pending",
    status: hasRx ? "reviewing" : "received",
    placedAt: new Date().toISOString(),
  };
  list.push(rec);
  const ok = await atomicWriteJson(ORDERS_FILE, list);
  return ok ? toFull(rec) : null;
}

export async function listOrders(): Promise<OrderFull[]> {
  await ensureDemoSeed();
  const list = (await readJsonArray(ORDERS_FILE)) as StoredOrder[];
  return list.map(toFull).sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

/** Accepts "ORD-V9QW", "ord v9qw", "ORDV9QW" → "ORD-V9QW" (or "" if invalid). */
export function normalizeOrderReference(input: string): string {
  const match = input.trim().toUpperCase().match(/^ORD[-\s]?([A-Z0-9]{4})$/);
  return match ? `ORD-${match[1]}` : "";
}

export function isValidOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (VALID_STATUSES as string[]).includes(value);
}

/** Privacy-safe lookup for the tracking page. */
export async function findOrder(reference: string): Promise<OrderPublic | null> {
  await ensureDemoSeed();
  const ref = normalizeOrderReference(reference);
  if (!ref) return null;
  const list = (await readJsonArray(ORDERS_FILE)) as StoredOrder[];
  const found = list.find((r) => r.reference.toUpperCase() === ref);
  return found ? toPublic(found) : null;
}

/** Update an order's status (admin demo action). */
export async function updateOrderStatus(
  reference: string,
  status: OrderStatus
): Promise<OrderFull | null> {
  await ensureDemoSeed();
  const ref = normalizeOrderReference(reference);
  if (!ref) return null;
  const list = (await readJsonArray(ORDERS_FILE)) as StoredOrder[];
  const idx = list.findIndex((r) => r.reference.toUpperCase() === ref);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], status };
  if (!(await atomicWriteJson(ORDERS_FILE, list))) return null;
  return toFull(list[idx]);
}

/** Persist MediPoints bookkeeping onto a stored order (post-order hook). */
export async function updateOrderLoyalty(
  reference: string,
  points: { earned: number; redeemed: number; redeemedKes: number }
): Promise<boolean> {
  const ref = normalizeOrderReference(reference);
  if (!ref) return false;
  const list = (await readJsonArray(ORDERS_FILE)) as StoredOrder[];
  const idx = list.findIndex((r) => r.reference.toUpperCase() === ref);
  if (idx === -1) return false;
  list[idx] = {
    ...list[idx],
    pointsEarned: points.earned,
    pointsRedeemed: points.redeemed,
    loyaltyDiscount: points.redeemedKes,
  };
  return atomicWriteJson(ORDERS_FILE, list);
}
