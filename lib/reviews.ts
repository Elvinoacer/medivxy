import fs from "node:fs/promises";
import path from "node:path";
import { getProduct } from "@/lib/data";

/**
 * Product review store (demo).
 *
 * Reviews are catalogued per product slug with a display name, 1–5 rating and
 * a short comment. Like the orders store, JSON is written atomically so a
 * crash can never truncate it — swap for a real database before production.
 * Pages read reviews CLIENT-side via /api/reviews so product pages stay
 * statically renderable and submitted reviews appear instantly.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const REVIEWS_FILE = "reviews.json";
const MAX_REVIEWS_PER_PRODUCT = 50;

export interface Review {
  slug: string;
  name: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string; // ISO
}

export interface ReviewSummary {
  avg: number; // rounded to 1 decimal
  count: number;
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

async function readReviewsFile(): Promise<Review[]> {
  try {
    const list = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, REVIEWS_FILE), "utf8")
    );
    return Array.isArray(list) ? (list as Review[]) : [];
  } catch {
    return [];
  }
}

/* ── Demo seed — reviews for popular products so ratings render out
 *     of the box on a fresh clone. ───────────────────────────────── */

const SEED_REVIEWS: Omit<Review, "createdAt">[] = [
  { slug: "paracetamol-500mg-tablets", name: "Amina W.", rating: 5, comment: "Always in stock at Roysambu and the team explains dosage clearly. My family's go-to." },
  { slug: "paracetamol-500mg-tablets", name: "Brian O.", rating: 4, comment: "Affordable and genuine. I order with delivery and it arrives the same afternoon." },
  { slug: "paracetamol-500mg-tablets", name: "Wanjiku M.", rating: 5, comment: "Bought for my mother — the pharmacist even reminded us not to exceed 8 tablets a day. Asante!" },
  { slug: "ibuprofen-400mg-tablets", name: "Kelvin K.", rating: 5, comment: "Works fast for my back pain after long drives. Fair price." },
  { slug: "ibuprofen-400mg-tablets", name: "Fatuma A.", rating: 4, comment: "Good product. Would love bigger pack sizes for the family." },
  { slug: "oral-rehydration-salts", name: "Grace N.", rating: 5, comment: "Saved us during a rough weekend with the kids. The team explained how to mix it properly." },
  { slug: "oral-rehydration-salts", name: "Dennis M.", rating: 5, comment: "A must-have in every home. Cheap and effective." },
  { slug: "cough-syrup-honey-lemon", name: "Mercy W.", rating: 5, comment: "The honey one actually tastes good — no drama giving it to my son. Delivery was quick too." },
  { slug: "cough-syrup-honey-lemon", name: "Joseph K.", rating: 4, comment: "Soothed my cough in two days. Recommended." },
  { slug: "baby-paracetamol-syrup", name: "Lucy N.", rating: 5, comment: "The pharmacist measured the right dose for my 8-month-old and wrote it on the box. Very caring team." },
  { slug: "baby-paracetamol-syrup", name: "Hawa S.", rating: 4, comment: "Good for fevers at night. I keep a bottle in the house always." },
  { slug: "digital-thermometer", name: "Peter M.", rating: 4, comment: "Fast readings, easy to clean. Does exactly what it should." },
  { slug: "digital-thermometer", name: "Zainab H.", rating: 5, comment: "Bought during flu season — accurate and the beep is loud enough to hear." },
  { slug: "blood-pressure-monitor", name: "Samuel O.", rating: 5, comment: "The team showed me how to position the cuff correctly. Readings match my clinic's machine." },
  { slug: "blood-pressure-monitor", name: "Rose A.", rating: 4, comment: "Clear display and memory function. Slightly pricey but worth it." },
  { slug: "hand-sanitizer-500ml", name: "Esther J.", rating: 5, comment: "Big bottle lasts long and doesn't dry my hands. I reorder every month." },
  { slug: "home-first-aid-kit", name: "Alex T.", rating: 5, comment: "Everything a home needs in one box — the checklist inside is a nice touch." },
  { slug: "multivitamin-tablets", name: "Njeri P.", rating: 4, comment: "I take one daily. Energy levels are better — will reorder." },
  { slug: "vitamin-c-1000mg", name: "Collins B.", rating: 5, comment: "Great value for the pack. The team advised taking it with food — worked well." },
  { slug: "baby-wipes-fragrance-free", name: "Nduta K.", rating: 5, comment: "Gentle on my daughter's skin, no fragrance, no rash. Happy customer." },
];

async function ensureSeed(): Promise<void> {
  try {
    await fs.access(path.join(DATA_DIR, REVIEWS_FILE));
    return;
  } catch {
    // Stagger the seeded timestamps over the last ~2 months.
    const seeded = SEED_REVIEWS.map((r, i) => ({
      ...r,
      createdAt: new Date(
        Date.now() - (i + 1) * 36 * 60 * 60 * 1000
      ).toISOString(),
    }));
    await atomicWriteJson(REVIEWS_FILE, seeded);
  }
}

/* ── Public API ────────────────────────────────────────────────── */

/** List reviews for one product (newest first), or all reviews. */
export async function listReviews(slug?: string): Promise<Review[]> {
  await ensureSeed();
  const list = await readReviewsFile();
  const valid = list.filter((r) => getProduct(r.slug));
  const forSlug = slug ? valid.filter((r) => r.slug === slug) : valid;
  return forSlug.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Average rating + count per product slug (only products with reviews). */
export async function getReviewSummaries(): Promise<
  Record<string, ReviewSummary>
> {
  await ensureSeed();
  const list = (await readReviewsFile()).filter((r) => getProduct(r.slug));
  const bySlug = new Map<string, { sum: number; count: number }>();
  for (const r of list) {
    const cur = bySlug.get(r.slug) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    bySlug.set(r.slug, cur);
  }
  const out: Record<string, ReviewSummary> = {};
  for (const [slug, { sum, count }] of bySlug) {
    out[slug] = { avg: Math.round((sum / count) * 10) / 10, count };
  }
  return out;
}

export interface AddReviewInput {
  slug: string;
  name: string;
  rating: number;
  comment: string;
}

/** Append a review (caller validates). Returns the stored review. */
export async function addReview(
  input: AddReviewInput
): Promise<Review | null> {
  await ensureSeed();
  const list = await readReviewsFile();
  const review: Review = {
    slug: input.slug,
    name: input.name,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
  };
  // Keep the store bounded per product (newest first after sort).
  const forProduct = list.filter((r) => r.slug === input.slug);
  if (forProduct.length >= MAX_REVIEWS_PER_PRODUCT) return null;
  list.push(review);
  const ok = await atomicWriteJson(REVIEWS_FILE, list);
  return ok ? review : null;
}

/** Privacy-safe summary for one slug (used by the POST response). */
export async function reviewSummaryFor(
  slug: string
): Promise<ReviewSummary | null> {
  const all = await getReviewSummaries();
  return all[slug] ?? null;
}
