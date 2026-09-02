"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  MessageCircle,
  PackageSearch,
  RefreshCw,
  SearchX,
  FileText,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { OrderTimeline } from "@/components/site/order-timeline";
import { BookingTimeline } from "@/components/site/booking-timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappLink, whatsappMessages } from "@/lib/business";
import {
  bookingCalendarLinks,
  bookingSummary,
  consultLabel,
  consultMinutes,
  slotLabel,
} from "@/lib/booking-shared";
import { track } from "@/lib/analytics";
import { useLanguage } from "@/components/site/language-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BookingPublic, MedicineRequestPublic } from "@/lib/types";

/** Reference codes used for the on-page demo hints (seeded in the demo store). */
const DEMO_REQUEST = "MDX-DEMO";
const DEMO_BOOKING = "BKG-DEMO";

/** Live auto-refresh cadence for a tracked card (paused while hidden). */
const POLL_MS = 30_000;

/** Recent successful lookups (this browser only, last 3). */
const RECENT_KEY = "medivyx:recent-lookups";
const RECENT_MAX = 3;

function loadRecentLookups(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v): v is string => typeof v === "string")
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

function saveRecentLookups(refs: string[]): void {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(refs));
  } catch {
    // storage unavailable — recents simply aren't remembered
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatAgo(at: number | null, now: number): string {
  if (!at) return "just now";
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type LookupResult =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; type: "request"; request: MedicineRequestPublic }
  | { kind: "found"; type: "booking"; booking: BookingPublic }
  | { kind: "not-found"; message: string };

interface TrackApiResponse {
  found?: boolean;
  type?: "request" | "booking";
  request?: MedicineRequestPublic;
  booking?: BookingPublic;
  error?: string;
}

/** Fetch + normalize a tracking lookup (module-level — no state access). */
async function fetchTrackResult(ref: string): Promise<LookupResult> {
  try {
    const res = await fetch(`/api/track-status?ref=${encodeURIComponent(ref)}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as TrackApiResponse;
    if (res.ok && data.found) {
      if (data.type === "booking" && data.booking) {
        return { kind: "found", type: "booking", booking: data.booking };
      }
      if (data.request) {
        return { kind: "found", type: "request", request: data.request };
      }
    }
    return {
      kind: "not-found",
      message: data.error ?? "We couldn't find that reference.",
    };
  } catch {
    return { kind: "not-found", message: "Network hiccup — please try again." };
  }
}

/**
 * Track a medicine request OR a consultation booking by reference
 * (research.md §8 + §24). MDX-XXXX → requests, BKG-XXXX → bookings.
 * Public view is privacy-safe: only the medicine/consult details, dates
 * and status — customer details stay in the staff area.
 */
export function TrackView({ initialRef }: { initialRef?: string }) {
  const { t } = useLanguage();
  const [reference, setReference] = useState(initialRef ?? "");
  const [result, setResult] = useState<LookupResult>({ kind: "idle" });

  // Live auto-refresh state.
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Mirror of `result` for use inside interval closures (no stale reads).
  const resultRef = useRef<LookupResult>({ kind: "idle" });
  const inFlightRef = useRef(false);

  // Recent successful lookups — recalled as chips under the form.
  const [recent, setRecent] = useState<string[]>([]);

  const rememberLookup = useCallback((ref: string) => {
    setRecent((prev) => {
      const next = [ref, ...prev.filter((r) => r !== ref)].slice(0, RECENT_MAX);
      saveRecentLookups(next);
      return next;
    });
  }, []);

  // Restore recents after mount (localStorage is client-only).
  // Indirect setState (open-status pattern) — runs once after mount.
  useEffect(() => {
    const restore = () => setRecent(loadRecentLookups());
    restore();
  }, []);

  const applyResult = useCallback((next: LookupResult) => {
    resultRef.current = next;
    setResult(next);
  }, []);

  /** Merge a fresh lookup outcome: bump the clock, flag status changes. */
  const mergeOutcome = useCallback(
    (outcome: LookupResult) => {
      if (outcome.kind !== "found") return;
      setLastChecked(Date.now());
      const prev = resultRef.current;
      if (prev.kind === "found") {
        const prevStatus =
          prev.type === "booking" ? prev.booking.status : prev.request.status;
        const nextStatus =
          outcome.type === "booking"
            ? outcome.booking.status
            : outcome.request.status;
        if (prevStatus !== nextStatus) {
          setStatusNote(`Status updated to “${statusLabel(nextStatus)}”`);
        }
      }
      applyResult(outcome);
    },
    [applyResult]
  );

  useEffect(() => {
    track("page_view", { page: "track" });
  }, []);

  // Auto-lookup when arriving with ?ref= (e.g. from a success card or chat).
  useEffect(() => {
    const ref = (initialRef ?? "").trim();
    if (!ref) return;
    let cancelled = false;
    const run = async () => {
      applyResult({ kind: "loading" });
      const outcome = await fetchTrackResult(ref);
      if (cancelled) return;
      if (outcome.kind === "found") {
        setActiveRef(ref);
        rememberLookup(ref);
      }
      mergeOutcome(outcome);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [initialRef, applyResult, mergeOutcome, rememberLookup]);

  async function lookup(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    applyResult({ kind: "loading" });
    track("search", { query: `track:${trimmed.slice(0, 12)}`, source: "track" });
    const outcome = await fetchTrackResult(trimmed);
    if (outcome.kind === "found") {
      setActiveRef(trimmed);
      rememberLookup(trimmed);
    } else {
      setActiveRef(null);
      setLastChecked(null);
    }
    mergeOutcome(outcome);
  }

  /** Manual refresh button. */
  const refreshNow = useCallback(async () => {
    const ref = activeRef;
    if (!ref || inFlightRef.current) return;
    inFlightRef.current = true;
    setRefreshing(true);
    try {
      const outcome = await fetchTrackResult(ref);
      if (outcome.kind === "not-found") {
        // Distinguish a genuine 404 from a network failure so a silent
        // dead poll doesn't look like the request disappeared.
        if (outcome.message.includes("Network")) {
          toast.error("Couldn't refresh right now", {
            description: "We'll keep trying automatically every 30 seconds.",
          });
        }
        return; // keep the current card — a transient failure shouldn't wipe it
      }
      mergeOutcome(outcome);
    } finally {
      inFlightRef.current = false;
      setRefreshing(false);
    }
  }, [activeRef, mergeOutcome]);

  // Poll the tracked reference every 30s while the tab is visible.
  useEffect(() => {
    if (!activeRef) return;
    const id = setInterval(
      () => {
        if (document.hidden || inFlightRef.current) return;
        void refreshNow();
      },
      POLL_MS
    );
    return () => clearInterval(id);
  }, [activeRef, refreshNow]);

  // "Updated Xs ago" ticker (re-render every 5s while a card is live).
  useEffect(() => {
    if (!activeRef) return;
    const id = setInterval(() => setNowTick(Date.now()), 5_000);
    return () => clearInterval(id);
  }, [activeRef]);

  // Auto-dismiss the status-change note.
  useEffect(() => {
    if (!statusNote) return;
    const t = setTimeout(() => setStatusNote(null), 8_000);
    return () => clearTimeout(t);
  }, [statusNote]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await lookup(reference);
  }

  function tryDemo(code: string) {
    setReference(code);
    void lookup(code);
  }

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.track.eyebrow")}
        title={t("page.track.title")}
        description={t("page.track.desc")}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-2xl px-4 py-12 pb-20 sm:px-6 sm:py-16">
          <Reveal>
            <form
              id="track-form"
              onSubmit={onSubmit}
              className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8"
            >
              <label
                htmlFor="track-reference"
                className="text-sm font-semibold text-foreground"
              >
                Reference code
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <div className="group flex flex-1 items-center gap-2 rounded-full border bg-background px-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <FileText
                    aria-hidden="true"
                    className="size-4.5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary"
                  />
                  <input
                    id="track-reference"
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={reference}
                    onChange={(e) => setReference(e.target.value.slice(0, 12))}
                    placeholder="MDX-XXXX or BKG-XXXX"
                    aria-describedby="track-hint"
                    className="h-12 min-w-0 flex-1 bg-transparent font-mono text-sm uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/70"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 min-w-36 rounded-full px-7"
                  disabled={result.kind === "loading" || reference.trim().length === 0}
                >
                  {result.kind === "loading" ? (
                    <>
                      <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <PackageSearch aria-hidden="true" className="size-4.5" />
                      Track status
                    </>
                  )}
                </Button>
              </div>
              <p
                id="track-hint"
                className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground"
              >
                Find the code on your confirmation.
                <button
                  type="button"
                  onClick={() => tryDemo(DEMO_REQUEST)}
                  className="inline-flex min-h-8 items-center rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Demo: {DEMO_REQUEST}
                </button>
                <button
                  type="button"
                  onClick={() => tryDemo(DEMO_BOOKING)}
                  className="inline-flex min-h-8 items-center rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Demo: {DEMO_BOOKING}
                </button>
              </p>
              {recent.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
                  <Clock
                    aria-hidden="true"
                    className="size-3.5 text-muted-foreground/70"
                  />
                  <span className="sr-only">Recent lookups:</span>
                  Recent:
                  {recent.map((ref) => (
                    <button
                      key={ref}
                      type="button"
                      onClick={() => tryDemo(ref)}
                      aria-label={`Look up ${ref} again`}
                      className="inline-flex min-h-8 items-center rounded-full border bg-background px-2.5 py-1 font-mono font-semibold tracking-wide text-primary transition-colors hover:border-primary/40 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {ref}
                    </button>
                  ))}
                </p>
              )}
            </form>
          </Reveal>

          <div aria-live="polite" className="mt-6">
            {result.kind === "loading" && (
              <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <Skeleton className="skeleton-shimmer size-10 rounded-full" />
                  <div className="min-w-0">
                    <Skeleton className="skeleton-shimmer h-5 w-40" />
                    <Skeleton className="skeleton-shimmer mt-2 h-3.5 w-56" />
                  </div>
                </div>
                <div className="mt-8 space-y-7">
                  <Skeleton className="skeleton-shimmer h-8 w-full" />
                  <Skeleton className="skeleton-shimmer h-8 w-full" />
                  <Skeleton className="skeleton-shimmer h-8 w-2/3" />
                </div>
                <p className="sr-only" role="status">
                  Looking up your reference…
                </p>
              </div>
            )}

            {result.kind === "found" && result.type === "request" && (
              <Reveal>
                <div className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                        <FileText aria-hidden="true" className="size-4" />
                        <span className="font-mono tracking-wider">
                          {result.request.reference}
                        </span>
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                        <PackageSearch aria-hidden="true" className="size-3.5" />
                        Medicine request
                      </p>
                      <h2 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
                        {result.request.medicine}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Submitted{" "}
                        {formatDate(result.request.receivedAt)} ·{" "}
                        {result.request.fulfilment === "delivery"
                          ? "Delivery"
                          : "Pickup"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2.5 sm:items-center">
                      <span
                        className="live-chip"
                        title="This card auto-refreshes every 30 seconds while the page is open."
                      >
                        <span className="live-dot" aria-hidden="true" />
                        Live
                        <span className="font-normal text-primary/70">
                          · {formatAgo(lastChecked, nowTick)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void refreshNow()}
                        disabled={refreshing}
                        aria-label="Refresh status now"
                        title="Refresh now"
                        className="inline-flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                      >
                        <RefreshCw
                          aria-hidden="true"
                          className={cn("size-4", refreshing && "animate-spin")}
                        />
                      </button>
                    </div>
                  </div>

                  {statusNote && (
                    <div
                      role="status"
                      className="check-pop mt-5 flex items-center gap-2 rounded-xl bg-mint/70 px-4 py-2.5 text-sm font-semibold text-mint-foreground"
                    >
                      <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
                      {statusNote}
                    </div>
                  )}

                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Progress
                    </h3>
                    <OrderTimeline
                      status={result.request.status}
                      fulfilment={result.request.fulfilment}
                    />
                  </div>

                  <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Button asChild className="rounded-full px-6">
                      <a
                        href={whatsappLink(
                          whatsappMessages.request(result.request.reference)
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          track("whatsapp_click", { source: "track" })
                        }
                      >
                        <MessageCircle aria-hidden="true" className="size-4.5" />
                        Ask about this request
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Status is updated by the pharmacy team — this page checks
                      automatically every 30 seconds.
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            {result.kind === "found" && result.type === "booking" && (
              <Reveal>
                <div className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                        <CalendarCheck aria-hidden="true" className="size-4" />
                        <span className="font-mono tracking-wider">
                          {result.booking.reference}
                        </span>
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                        <CalendarCheck aria-hidden="true" className="size-3.5" />
                        Consultation booking
                      </p>
                      <h2 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
                        {consultLabel(result.booking.consultType)}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatBookingDate(result.booking.date)} ·{" "}
                        {slotLabel(result.booking.slot)} ·{" "}
                        {consultMinutes(result.booking.consultType)} min
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2.5 sm:items-center">
                      <span
                        className="live-chip"
                        title="This card auto-refreshes every 30 seconds while the page is open."
                      >
                        <span className="live-dot" aria-hidden="true" />
                        Live
                        <span className="font-normal text-primary/70">
                          · {formatAgo(lastChecked, nowTick)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => void refreshNow()}
                        disabled={refreshing}
                        aria-label="Refresh status now"
                        title="Refresh now"
                        className="inline-flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-all hover:border-primary/40 hover:text-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                      >
                        <RefreshCw
                          aria-hidden="true"
                          className={cn("size-4", refreshing && "animate-spin")}
                        />
                      </button>
                    </div>
                  </div>

                  {statusNote && (
                    <div
                      role="status"
                      className="check-pop mt-5 flex items-center gap-2 rounded-xl bg-mint/70 px-4 py-2.5 text-sm font-semibold text-mint-foreground"
                    >
                      <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />
                      {statusNote}
                    </div>
                  )}

                  <div className="mt-8 border-t pt-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Progress
                    </h3>
                    <BookingTimeline status={result.booking.status} />
                  </div>

                  {result.booking.status !== "completed" && (
                    <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-3">
                        <Button asChild className="rounded-full px-6">
                          <a
                            href={
                              bookingCalendarLinks(result.booking).googleUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              track("share_click", {
                                source: "track-calendar",
                                target: "google",
                              })
                            }
                          >
                            <CalendarPlus aria-hidden="true" className="size-4.5" />
                            Add to calendar
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-full px-6"
                        >
                          <a
                            href={bookingCalendarLinks(result.booking).icsHref}
                            download={bookingCalendarLinks(result.booking).icsFilename}
                            onClick={() =>
                              track("share_click", {
                                source: "track-calendar",
                                target: "ics",
                              })
                            }
                          >
                            <Download aria-hidden="true" className="size-4.5" />
                            Save .ics file
                          </a>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Arrive a few minutes early.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <Button asChild className="rounded-full px-6">
                      <a
                        href={whatsappLink(
                          whatsappMessages.booking(
                            result.booking.reference,
                            bookingSummary(result.booking).toLowerCase()
                          )
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          track("whatsapp_click", { source: "track" })
                        }
                      >
                        <MessageCircle aria-hidden="true" className="size-4.5" />
                        Ask about this booking
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Status is updated by the pharmacy team.
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            {result.kind === "not-found" && (
              <Reveal>
                <div className="rounded-3xl border border-dashed bg-card p-8 text-center shadow-sm">
                  <SearchX
                    aria-hidden="true"
                    className="mx-auto size-10 text-muted-foreground/60"
                  />
                  <p className="mt-3 font-medium text-foreground">
                    {result.message}
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    Check the code on your confirmation — medicine requests
                    start with MDX-, consultation bookings with BKG-. If you
                    didn&apos;t get a code, message the team and they&apos;ll
                    help right away.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <a
                      href={whatsappLink(
                        `Hi Medivyx, I need help tracking my request or booking.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        track("whatsapp_click", { source: "track-notfound" })
                      }
                      className="wa-cta inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm"
                    >
                      <MessageCircle aria-hidden="true" className="size-4" />
                      Ask on WhatsApp
                    </a>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBookingDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
