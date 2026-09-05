import fs from "node:fs/promises";
import path from "node:path";
import { products } from "@/lib/data";

/**
 * Live stock levels (demo).
 *
 * The catalogue's static `availability` field is the BASELINE; this store
 * holds staff-managed overrides per product slug. Levels are public
 * information ("Only 3 left"), updates are admin-only, and placing an order
 * decrements the levels (auto stock-keeping). Swap for a real DB + a proper
 * inventory before production.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const STOCK_FILE = "stock.json";

/** At/below this level the catalogue shows "Only N left". */
export const LOW_STOCK_THRESHOLD = 5;

/** Baseline level implied by the catalogue when no override exists. */
export function baselineLevel(availability: string): number | null {
  if (availability === "in-stock") return 24;
  if (availability === "low-stock") return 6;
  return null; // "ask" items are ordered per request — not stock-managed
}

/** Stock-managed products (everything except "ask" items). */
export function managedProducts() {
  return products.filter((p) => baselineLevel(p.availability) !== null);
}

/* ── Atomic JSON store helpers (mirrors lib/orders.ts) ─────────── */

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

async function readOverrides(): Promise<Record<string, number>> {
  try {
    const raw = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, STOCK_FILE), "utf8")
    );
    if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
      return raw as Record<string, number>;
    }
  } catch {
    // fresh store
  }
  return {};
}

/* ── Public API ────────────────────────────────────────────────── */

/** Effective stock levels for all managed products (override > baseline). */
export async function getStockLevels(): Promise<Record<string, number>> {
  const overrides = await readOverrides();
  const levels: Record<string, number> = {};
  for (const p of managedProducts()) {
    const override = overrides[p.slug];
    levels[p.slug] =
      typeof override === "number" && Number.isFinite(override)
        ? Math.max(0, Math.min(999, Math.round(override)))
        : (baselineLevel(p.availability) as number);
  }
  return levels;
}

/** Staff action: set a product's level directly (0–999). */
export async function setStockLevel(
  slug: string,
  level: number
): Promise<Record<string, number> | null> {
  const managed = managedProducts().some((p) => p.slug === slug);
  if (!managed) return null;
  const clamped = Math.max(0, Math.min(999, Math.round(level)));
  const overrides = await readOverrides();
  overrides[slug] = clamped;
  if (!(await atomicWriteJson(STOCK_FILE, overrides))) return null;
  return getStockLevels();
}

/**
 * Order-side auto stock-keeping: verify every line is in stock, then
 * decrement the levels. Returns the first problem (or null when OK).
 */
export async function consumeStock(
  lines: { slug: string; quantity: number }[]
): Promise<{ slug: string; name: string; available: number } | null> {
  const levels = await getStockLevels();
  for (const line of lines) {
    const available = levels[line.slug];
    if (typeof available === "number" && available < line.quantity) {
      const product = products.find((p) => p.slug === line.slug);
      return {
        slug: line.slug,
        name: product?.name ?? line.slug,
        available,
      };
    }
  }
  // All lines fit — decrement.
  const overrides = await readOverrides();
  for (const line of lines) {
    const current = levels[line.slug];
    if (typeof current === "number") overrides[line.slug] = current - line.quantity;
  }
  await atomicWriteJson(STOCK_FILE, overrides);
  return null;
}
