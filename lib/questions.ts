import fs from "node:fs/promises";
import path from "node:path";
import { getProduct } from "@/lib/data";

/**
 * Product Q&A store (demo).
 *
 * Customers ask a question on a product page; the pharmacy team answers it
 * from the admin dashboard and the answer appears publicly on the product
 * page. Pending questions show as "awaiting the pharmacist's answer".
 * Mirrors the reviews store: atomic JSON writes, auto-seeded, client-side
 * fetching so product pages stay statically renderable.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const QUESTIONS_FILE = "questions.json";
const MAX_QUESTIONS_PER_PRODUCT = 40;

export interface Question {
  id: string; // QA-XXXX
  slug: string;
  askedBy: string; // display name ("Anonymous" allowed)
  question: string; // 10–400 chars
  answer: string; // "" while pending
  answeredBy: string; // who answered (team)
  createdAt: string; // ISO
  answeredAt: string | null; // ISO when answered
}

/* ── Atomic JSON store helpers (mirrors lib/orders.ts) ─────────── */

async function atomicWriteJson(data: unknown): Promise<boolean> {
  const target = path.join(DATA_DIR, QUESTIONS_FILE);
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

async function readQuestionsFile(): Promise<Question[]> {
  try {
    const list = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, QUESTIONS_FILE), "utf8")
    );
    return Array.isArray(list) ? (list as Question[]) : [];
  } catch {
    return [];
  }
}

/* ── Demo seed — a few answered questions so product pages render
 *     a living Q&A out of the box on a fresh clone. ────────────────── */

const SEED_QUESTIONS: Omit<Question, "createdAt" | "answeredAt" | "id">[] = [
  {
    slug: "paracetamol-500mg-tablets",
    askedBy: "Amina W.",
    question: "Is this safe to take while breastfeeding?",
    answer:
      "Yes — paracetamol 500mg is considered safe at the usual dose while breastfeeding (max 8 tablets in 24 hours). If you take anything else regularly, message us on WhatsApp and the pharmacist will double-check for you.",
    answeredBy: "Pharmacist — Medivyx",
  },
  {
    slug: "paracetamol-500mg-tablets",
    askedBy: "Dennis M.",
    question: "Can I order two packs at once, or is there a limit?",
    answer:
      "Two packs is fine for a household order. For larger quantities the team confirms availability by phone before dispatch — the checkout already caps quantities so stock stays fair for everyone.",
    answeredBy: "Medivyx team",
  },
  {
    slug: "ibuprofen-400mg-tablets",
    askedBy: "Kelvin K.",
    question: "Can I take ibuprofen with my blood pressure medication?",
    answer:
      "Please check with us first — ibuprofen can raise blood pressure and interact with some BP medicines. WhatsApp us your medication names and the pharmacist will advise before you order.",
    answeredBy: "Pharmacist — Medivyx",
  },
  {
    slug: "oral-rehydration-salts",
    askedBy: "Grace N.",
    question: "How many sachets should I give a 4-year-old per day?",
    answer:
      "For a 4-year-old with mild diarrhoea, one sachet after every loose stool up to about 4 sachets a day, mixed in the full 200ml of clean water. Bring the child in if it lasts more than two days.",
    answeredBy: "Pharmacist — Medivyx",
  },
  {
    slug: "blood-pressure-monitor",
    askedBy: "Samuel O.",
    question: "Does it come with batteries included?",
    answer:
      "Yes — the box includes 4 AAA batteries and a storage pouch. We also test the cuff before handing it over so it's calibrated out of the box.",
    answeredBy: "Medivyx team",
  },
  {
    slug: "baby-paracetamol-syrup",
    askedBy: "Lucy N.",
    question: "What dose do I give a 9-month-old baby?",
    answer:
      "The dose depends on the baby's weight (roughly 15mg per kg every 6 hours). WhatsApp us the weight and we'll write the exact syringe measurement for you — never guess with babies.",
    answeredBy: "Pharmacist — Medivyx",
  },
  {
    slug: "cough-syrup-honey-lemon",
    askedBy: "Mercy W.",
    question: "Is this syrup okay for a 3-year-old?",
    answer:
      "This honey-lemon syrup is suitable from 2 years at the children's dose on the label (2.5ml three times a day). For under-2s we recommend the baby range instead — ask us and we'll point you to it.",
    answeredBy: "Pharmacist — Medivyx",
  },
];

async function ensureSeed(): Promise<void> {
  try {
    await fs.access(path.join(DATA_DIR, QUESTIONS_FILE));
    return;
  } catch {
    const base = Date.now();
    const seeded = SEED_QUESTIONS.map((q, i) => ({
      ...q,
      id: `QA-SEED${String(i + 1).padStart(2, "0")}`,
      createdAt: new Date(base - (i + 2) * 72 * 60 * 60 * 1000).toISOString(),
      answeredAt: new Date(base - (i + 1) * 60 * 60 * 60 * 1000).toISOString(),
    }));
    await atomicWriteJson(seeded);
  }
}

/* ── IDs ───────────────────────────────────────────────────────── */

function randomId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 4; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `QA-${id}`;
}

/* ── Public API ────────────────────────────────────────────────── */

/** Questions for one product, answered first (newest first within groups). */
export async function listQuestions(slug: string): Promise<Question[]> {
  await ensureSeed();
  const list = (await readQuestionsFile()).filter(
    (q) => q.slug === slug && getProduct(q.slug)
  );
  const answered = list
    .filter((q) => q.answer)
    .sort((a, b) => (b.answeredAt ?? b.createdAt).localeCompare(a.answeredAt ?? a.createdAt));
  const pending = list
    .filter((q) => !q.answer)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...answered, ...pending];
}

/** All questions (staff view) — pending first, then newest answered. */
export async function listAllQuestions(): Promise<Question[]> {
  await ensureSeed();
  const list = (await readQuestionsFile()).filter((q) => getProduct(q.slug));
  const pending = list.filter((q) => !q.answer).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const answered = list
    .filter((q) => q.answer)
    .sort((a, b) => (b.answeredAt ?? b.createdAt).localeCompare(a.answeredAt ?? a.createdAt));
  return [...pending, ...answered];
}

export interface AddQuestionInput {
  slug: string;
  askedBy: string;
  question: string;
}

/** Append a pending question (caller validates). Returns the stored question. */
export async function addQuestion(
  input: AddQuestionInput
): Promise<Question | null> {
  await ensureSeed();
  const list = await readQuestionsFile();
  const question: Question = {
    id: randomId(),
    slug: input.slug,
    askedBy: input.askedBy,
    question: input.question,
    answer: "",
    answeredBy: "",
    createdAt: new Date().toISOString(),
    answeredAt: null,
  };
  const forProduct = list.filter((q) => q.slug === input.slug);
  if (forProduct.length >= MAX_QUESTIONS_PER_PRODUCT) return null;
  list.push(question);
  const ok = await atomicWriteJson(list);
  return ok ? question : null;
}

/** Staff action: answer (or re-answer) a question by id. */
export async function answerQuestion(
  id: string,
  answer: string,
  answeredBy: string
): Promise<Question | null> {
  await ensureSeed();
  const list = await readQuestionsFile();
  const idx = list.findIndex((q) => q.id === id);
  if (idx < 0) return null;
  list[idx] = {
    ...list[idx],
    answer,
    answeredBy,
    answeredAt: new Date().toISOString(),
  };
  const ok = await atomicWriteJson(list);
  return ok ? list[idx] : null;
}

/** Staff action: dismiss a question entirely (spam/duplicates). */
export async function dismissQuestion(id: string): Promise<boolean> {
  await ensureSeed();
  const list = await readQuestionsFile();
  const next = list.filter((q) => q.id !== id);
  if (next.length === list.length) return false;
  return atomicWriteJson(next);
}

/** Public summary per slug: { answered, pending } counts. */
export async function questionCounts(): Promise<
  Record<string, { answered: number; pending: number }>
> {
  await ensureSeed();
  const list = (await readQuestionsFile()).filter((q) => getProduct(q.slug));
  const out: Record<string, { answered: number; pending: number }> = {};
  for (const q of list) {
    const cur = out[q.slug] ?? { answered: 0, pending: 0 };
    if (q.answer) cur.answered += 1;
    else cur.pending += 1;
    out[q.slug] = cur;
  }
  return out;
}
