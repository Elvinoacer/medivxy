"use client";

/**
 * Lightweight demo analytics (research.md §25).
 * Fire-and-forget events are POSTed to /api/track and simple counts are
 * surfaced on /admin so the owner can see e.g. "N people viewed your
 * pharmacy this week". Swap for a real analytics provider in production.
 *
 * Consent: events are only sent after the visitor accepts analytics in the
 * cookie banner (localStorage "medivyx:consent" = "accepted"). Before a
 * decision (or after "essential only") nothing leaves the browser —
 * demo-style Kenya Data Protection Act behaviour.
 */

export type AnalyticsEvent =
  | "page_view"
  | "product_view"
  | "article_view"
  | "whatsapp_click"
  | "call_click"
  | "directions_click"
  | "prescription_request"
  | "booking_submit"
  | "contact_submit"
  | "search"
  | "search_open"
  | "compare_open"
  | "chat_message"
  | "navigation"
  | "share_click"
  | "language_toggle"
  | "newsletter_signup";

export const CONSENT_KEY = "medivyx:consent";

export type ConsentValue = "accepted" | "essential";

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function setAnalyticsConsent(value: ConsentValue): void {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // storage unavailable — consent simply can't be remembered
  }
}

export function track(
  event: AnalyticsEvent,
  data?: Record<string, string | number | boolean>
): void {
  if (!hasAnalyticsConsent()) return;
  try {
    const body = JSON.stringify({
      event,
      data: data ?? {},
      ts: Date.now(),
      path: typeof window !== "undefined" ? window.location.pathname : "",
    });
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // analytics must never break the site
  }
}
