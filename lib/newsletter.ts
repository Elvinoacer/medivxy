import fs from "node:fs/promises";
import path from "node:path";
import type { NewsletterSubscriber } from "@/lib/types";

export type { NewsletterSubscriber };

/**
 * Newsletter signup store (SERVER-ONLY — uses node:fs).
 *
 * Demo storage for footer sign-ups ("Stay well" health tips). Files are
 * gitignored demo storage — swap for a real mailing-list service before
 * production. Emails are stored lower-cased and de-duplicated.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const NEWSLETTER_FILE = "newsletter-signups.json";

interface StoredSubscriber {
  email: string;
  source?: string;
  subscribedAt: string;
}

async function readSubscribers(): Promise<StoredSubscriber[]> {
  try {
    const list = JSON.parse(
      await fs.readFile(path.join(DATA_DIR, NEWSLETTER_FILE), "utf8")
    );
    return Array.isArray(list) ? (list as StoredSubscriber[]) : [];
  } catch {
    return [];
  }
}

/** Atomic write: serialise to a temp file, then rename over the target. */
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

export async function listSubscribers(): Promise<NewsletterSubscriber[]> {
  return (await readSubscribers())
    .map((s) => ({
      email: s.email,
      source: s.source ?? "footer",
      subscribedAt: s.subscribedAt,
    }))
    .sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));
}

export async function countSubscribers(): Promise<number> {
  return (await readSubscribers()).length;
}

export type SubscribeResult =
  | { ok: true; already: boolean }
  | { ok: false; reason: "invalid" | "storage" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Valid, normalise and store a sign-up. Duplicates succeed silently. */
export async function subscribeEmail(
  rawEmail: string,
  source = "footer"
): Promise<SubscribeResult> {
  const email = rawEmail.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email) || email.includes("..")) {
    return { ok: false, reason: "invalid" };
  }
  try {
    const list = await readSubscribers();
    if (list.some((s) => s.email === email)) {
      return { ok: true, already: true };
    }
    list.push({ email, source, subscribedAt: new Date().toISOString() });
    if (!(await atomicWriteJson(NEWSLETTER_FILE, list))) {
      return { ok: false, reason: "storage" };
    }
    return { ok: true, already: false };
  } catch {
    return { ok: false, reason: "storage" };
  }
}
