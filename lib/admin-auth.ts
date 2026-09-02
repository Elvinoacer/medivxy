import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Demo staff-area auth (research.md §24 "admin-ready").
 * A single demo passcode grants a short-lived httpOnly cookie. Swap for real
 * accounts before production — the gate is intentionally simple because the
 * dashboard only shows anonymous demo analytics.
 *
 * Improvement in this revision: the session cookie now holds an HMAC
 * signature derived from the passcode (or ADMIN_SESSION_SECRET when set),
 * compared with `timingSafeEqual`. Previously the cookie value was the plain
 * string "granted", so anyone could forge a session with
 * `Cookie: medivyx_admin=granted` without knowing the passcode.
 */

export const ADMIN_COOKIE = "medivxy_admin";
/** Staff session lifetime (demo). */
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

/** Demo passcode (override with ADMIN_DEMO_PASSCODE in production). */
export function adminDemoPasscode(): string {
  return process.env.ADMIN_DEMO_PASSCODE ?? "medivyx2025";
}

/** Secret used to sign the session token (env override for production). */
function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? `medivyx:${adminDemoPasscode()}`;
}

/** The signed token stored in the cookie. */
export function makeAdminSessionToken(): string {
  return createHmac("sha256", sessionSecret())
    .update("medivyx-admin-session")
    .digest("hex");
}

/** Constant-time comparison of two hex strings. */
function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Whether the current visitor holds a valid staff cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value ?? "";
  if (!value) return false;
  return safeEqualHex(value, makeAdminSessionToken());
}
