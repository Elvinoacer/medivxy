import { cookies } from "next/headers";

/**
 * Demo staff-area auth (research.md §24 "admin-ready").
 * A single demo passcode grants a short-lived httpOnly cookie. Swap for real
 * accounts before production — the gate is intentionally simple because the
 * dashboard only shows anonymous demo analytics.
 */

export const ADMIN_COOKIE = "medivyx_admin";
const GRANTED = "granted";
/** Staff session lifetime (demo). */
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

/** Demo passcode (override with ADMIN_DEMO_PASSCODE in production). */
export function adminDemoPasscode(): string {
  return process.env.ADMIN_DEMO_PASSCODE ?? "medivyx2025";
}

/** Whether the current visitor holds a valid staff cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === GRANTED;
}
