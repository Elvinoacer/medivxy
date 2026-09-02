"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Eye,
  MessageCircle,
  Phone,
  FileText,
  Search,
  Bot,
  TrendingUp,
  RefreshCw,
  Package,
  Newspaper,
  Lock,
  LogOut,
  Loader2,
  ClipboardCheck,
  PackageCheck,
  BadgeCheck,
  Inbox,
  Truck,
  Store,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Clock,
  Download,
  Languages,
  MailPlus,
  Undo2,
  AlertTriangle,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { track } from "@/lib/analytics";
import {
  bookingSummary,
  consultLabel,
} from "@/lib/booking-shared";
import { cn } from "@/lib/utils";
import type {
  BookingFull,
  BookingStatus,
  MedicineRequestFull,
  MedicineRequestStatus,
  NewsletterSubscriber,
} from "@/lib/types";

interface Stats {
  events: Record<string, number>;
  totals: {
    pageViews: number;
    whatsappClicks: number;
    callClicks: number;
    requests: number;
    bookings: number;
    searches: number;
    chats: number;
    productViews: number;
    articleViews: number;
    directions: number;
    contacts: number;
    newsletter?: number;
    languageToggles?: number;
  };
  languageBreakdown?: { sw: number; en: number };
  weekly: { label: string; views: number }[];
  topProducts: { product: string; views: number }[];
  since: string | null;
}

type AuthState = "checking" | "locked" | "open";

const STATUS_ORDER: MedicineRequestStatus[] = [
  "received",
  "confirmed",
  "ready",
  "fulfilled",
];

const STATUS_META: Record<
  MedicineRequestStatus,
  { label: string; chip: string; icon: typeof ClipboardCheck }
> = {
  received: {
    label: "Received",
    chip: "bg-muted text-muted-foreground",
    icon: Inbox,
  },
  confirmed: {
    label: "Confirmed",
    chip: "bg-primary/10 text-primary",
    icon: ClipboardCheck,
  },
  ready: {
    label: "Ready",
    chip: "bg-honey-soft text-accent-foreground",
    icon: PackageCheck,
  },
  fulfilled: {
    label: "Fulfilled",
    chip: "bg-mint text-mint-foreground",
    icon: BadgeCheck,
  },
};

const NEXT_STATUS_LABEL: Partial<Record<MedicineRequestStatus, string>> = {
  received: "Confirm",
  confirmed: "Mark ready",
  ready: "Mark fulfilled",
};

/* ── Consultation bookings ── */

const BOOKING_STATUS_ORDER: BookingStatus[] = [
  "requested",
  "confirmed",
  "completed",
];

const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; chip: string; icon: typeof CalendarCheck }
> = {
  requested: {
    label: "Requested",
    chip: "bg-muted text-muted-foreground",
    icon: CalendarClock,
  },
  confirmed: {
    label: "Confirmed",
    chip: "bg-primary/10 text-primary",
    icon: CalendarCheck,
  },
  completed: {
    label: "Completed",
    chip: "bg-mint text-mint-foreground",
    icon: BadgeCheck,
  },
};

const BOOKING_NEXT_LABEL: Partial<Record<BookingStatus, string>> = {
  requested: "Confirm",
  confirmed: "Mark completed",
};

/** Small CSV download action for a staff queue panel (renders when data exists). */
function ExportCsvButton({
  dataset,
  label,
}: {
  dataset: "bookings" | "requests" | "newsletter";
  label: string;
}) {
  const [days, setDays] = useState<"all" | "7" | "30">("all");

  const rangeLabel =
    days === "all"
      ? "all time"
      : `the last ${days} days`;

  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`export-range-${dataset}`}>
        Date range for the {label} export
      </label>
      <select
        id={`export-range-${dataset}`}
        value={days}
        onChange={(e) => setDays(e.target.value as "all" | "7" | "30")}
        className="h-9 rounded-full border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        title="Filter the CSV by date range"
      >
        <option value="all">All time</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
      </select>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-9 rounded-full px-4 text-xs"
      >
        <a
          href={`/api/admin-export?dataset=${dataset}${days === "all" ? "" : `&days=${days}`}`}
          download
          aria-label={`Export ${rangeLabel} ${label} as a CSV spreadsheet`}
          title={`Download ${rangeLabel} ${label} as CSV`}
        >
          <Download aria-hidden="true" className="size-3.5" />
          Export CSV
        </a>
      </Button>
    </div>
  );
}

/**
 * Staff dashboard (research.md §25 + §24 admin-ready).
 * Behind a demo passcode gate: anonymous analytics + the medicine-request
 * queue whose status updates feed the public tracking page.
 */
export function AdminView() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MedicineRequestFull[] | null>(null);
  const [updatingRef, setUpdatingRef] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingFull[] | null>(null);
  const [updatingBookingRef, setUpdatingBookingRef] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[] | null>(null);

  // Queue filters + load errors — previously a failed fetch silently kept
  // stale data with no hint that anything was wrong.
  const [requestFilter, setRequestFilter] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Gate state
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    track("page_view", { page: "admin" });
    const check = async () => {
      try {
        const res = await fetch("/api/admin-login", { cache: "no-store" });
        const data = (await res.json()) as { authenticated?: boolean };
        setAuth(data.authenticated ? "open" : "locked");
      } catch {
        setAuth("locked");
      }
    };
    void check();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/track", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        setStats((await res.json()) as Stats);
        setLoadError(null);
      } else {
        setLoadError("The analytics service returned an error — showing the last successful numbers.");
      }
    } catch {
      setLoadError("Couldn't reach the analytics service — showing the last successful numbers.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRequests() {
    try {
      const res = await fetch("/api/admin-requests", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { requests?: MedicineRequestFull[] };
        setRequests(data.requests ?? []);
        setLoadError(null);
      } else {
        setLoadError("The medicine-request queue failed to load — try Refresh.");
      }
    } catch {
      setLoadError("The medicine-request queue failed to load — try Refresh.");
    }
  }

  async function loadBookings() {
    try {
      const res = await fetch("/api/admin-bookings", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { bookings?: BookingFull[] };
        setBookings(data.bookings ?? []);
        setLoadError(null);
      } else {
        setLoadError("The bookings queue failed to load — try Refresh.");
      }
    } catch {
      setLoadError("The bookings queue failed to load — try Refresh.");
    }
  }

  async function loadSubscribers() {
    try {
      const res = await fetch("/api/admin-newsletter", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as {
          subscribers?: NewsletterSubscriber[];
        };
        setSubscribers(data.subscribers ?? []);
      }
    } catch {
      // keep previous list
    }
  }

  useEffect(() => {
    if (auth !== "open") return;
    const load = () => {
      void loadStats();
      void loadRequests();
      void loadBookings();
      void loadSubscribers();
    };
    load();
  }, [auth]);

  function refresh() {
    void loadStats();
    void loadRequests();
    void loadBookings();
    void loadSubscribers();
  }

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setAuth("open");
        setPasscode("");
      } else {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setLoginError(data?.error ?? "Login failed — please try again.");
      }
    } catch {
      setLoginError("Network error — please try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function onLogout() {
    await fetch("/api/admin-login", { method: "DELETE" }).catch(() => null);
    setAuth("locked");
    setStats(null);
    setRequests(null);
    setBookings(null);
    setSubscribers(null);
  }

  /** Generic status setter for medicine requests (advance OR undo —
   *  previously a misclick was irreversible in the UI). */
  async function setRequestStatus(
    request: MedicineRequestFull,
    next: MedicineRequestStatus,
    undoing = false
  ) {
    if (next === request.status) return;
    setUpdatingRef(request.reference);
    try {
      const res = await fetch("/api/admin-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: request.reference, status: next }),
      });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { request?: MedicineRequestFull };
        if (data.request) {
          setRequests((list) =>
            (list ?? []).map((r) =>
              r.reference === data.request!.reference ? data.request! : r
            )
          );
          toast.success(
            undoing
              ? `${request.reference} moved back to "${STATUS_META[next].label}"`
              : `${request.reference} marked "${STATUS_META[next].label}"`,
            { description: "The public tracking page updates within 30 seconds." }
          );
        }
      } else {
        toast.error(`Couldn't update ${request.reference} — please try again.`);
      }
    } catch {
      toast.error(`Couldn't update ${request.reference} — network error.`);
    } finally {
      setUpdatingRef(null);
    }
  }

  function advanceStatus(request: MedicineRequestFull) {
    const idx = STATUS_ORDER.indexOf(request.status);
    const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
    return setRequestStatus(request, next);
  }

  function revertStatus(request: MedicineRequestFull) {
    const idx = STATUS_ORDER.indexOf(request.status);
    const prev = STATUS_ORDER[Math.max(idx - 1, 0)];
    return setRequestStatus(request, prev, true);
  }

  /** Generic status setter for bookings (advance OR undo). */
  async function setBookingStatus(
    booking: BookingFull,
    next: BookingStatus,
    undoing = false
  ) {
    if (next === booking.status) return;
    setUpdatingBookingRef(booking.reference);
    try {
      const res = await fetch("/api/admin-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: booking.reference, status: next }),
      });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { booking?: BookingFull };
        if (data.booking) {
          setBookings((list) =>
            (list ?? []).map((b) =>
              b.reference === data.booking!.reference ? data.booking! : b
            )
          );
          toast.success(
            undoing
              ? `${booking.reference} moved back to "${BOOKING_STATUS_META[next].label}"`
              : `${booking.reference} marked "${BOOKING_STATUS_META[next].label}"`,
            { description: "The public tracking page updates within 30 seconds." }
          );
        }
      } else {
        toast.error(`Couldn't update ${booking.reference} — please try again.`);
      }
    } catch {
      toast.error(`Couldn't update ${booking.reference} — network error.`);
    } finally {
      setUpdatingBookingRef(null);
    }
  }

  function advanceBooking(booking: BookingFull) {
    const idx = BOOKING_STATUS_ORDER.indexOf(booking.status);
    const next = BOOKING_STATUS_ORDER[Math.min(idx + 1, BOOKING_STATUS_ORDER.length - 1)];
    return setBookingStatus(booking, next);
  }

  function revertBooking(booking: BookingFull) {
    const idx = BOOKING_STATUS_ORDER.indexOf(booking.status);
    const prev = BOOKING_STATUS_ORDER[Math.max(idx - 1, 0)];
    return setBookingStatus(booking, prev, true);
  }

  // Queue search filters (reference, name, medicine text…).
  const visibleRequests = useMemo(() => {
    if (!requests) return null;
    const q = requestFilter.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [r.reference, r.medicine, r.fullName, r.phone, r.notes]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [requests, requestFilter]);

  const visibleBookings = useMemo(() => {
    if (!bookings) return null;
    const q = bookingFilter.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      [b.reference, consultLabel(b.consultType), b.fullName, b.phone, b.notes]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [bookings, bookingFilter]);

  const maxWeek = Math.max(1, ...(stats?.weekly.map((w) => w.views) ?? [1]));

  type StatCard = {
    icon: typeof Eye;
    label: string;
    value: number;
    tone: "primary" | "green" | "honey";
    sub?: string;
  };

  const cards: StatCard[] = stats
    ? ([
        { icon: Eye, label: "Page views", value: stats.totals.pageViews, tone: "primary" },
        { icon: MessageCircle, label: "WhatsApp clicks", value: stats.totals.whatsappClicks, tone: "green" },
        { icon: Phone, label: "Call clicks", value: stats.totals.callClicks, tone: "primary" },
        { icon: FileText, label: "Medicine requests", value: stats.totals.requests, tone: "honey" },
        { icon: CalendarCheck, label: "Consultation bookings", value: stats.totals.bookings, tone: "green" },
        { icon: Bot, label: "Chat messages", value: stats.totals.chats, tone: "green" },
        { icon: Search, label: "Searches", value: stats.totals.searches, tone: "primary" },
        { icon: Package, label: "Product views", value: stats.totals.productViews, tone: "honey" },
        { icon: Newspaper, label: "Article views", value: stats.totals.articleViews, tone: "primary" },
        { icon: MailPlus, label: "Newsletter list", value: subscribers?.length ?? 0, tone: "honey" },
      ] as StatCard[])
    : [];

  // Language card renders only when the API reports the newer totals shape.
  if (stats?.totals.languageToggles != null) {
    cards.push({
      icon: Languages,
      label: "Language switches",
      value: stats.totals.languageToggles,
      tone: "primary",
      sub: `${stats.languageBreakdown?.sw ?? 0} to Kiswahili · ${stats.languageBreakdown?.en ?? 0} to English`,
    });
  }

  /* ---------------- Passcode gate ---------------- */
  if (auth === "checking") {
    return (
      <main id="main-content">
        <PageHero
          eyebrow="Admin — Demo"
          title="Your pharmacy at a glance"
          description="Staff area — checking your session…"
        />
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-4 py-16 pb-20 sm:px-6">
            <div className="mx-auto max-w-md space-y-4">
              <Skeleton className="h-40 rounded-3xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (auth === "locked") {
    return (
      <main id="main-content">
        <PageHero
          eyebrow="Admin — Demo"
          title="Staff area"
          description="The dashboard shows anonymous demo analytics and the medicine-request queue. Enter the demo passcode to continue."
        />
        <section className="bg-background">
          <div className="mx-auto max-w-md px-4 py-12 pb-20 sm:px-6 sm:py-16">
            <Reveal>
              <form
                onSubmit={onLogin}
                className="rounded-3xl border bg-card p-8 shadow-lg"
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Lock aria-hidden="true" className="size-6" />
                </span>
                <h2 className="mt-5 font-display text-xl font-semibold">
                  Sign in to the dashboard
                </h2>
                <label
                  htmlFor="admin-passcode"
                  className="mt-6 block text-sm font-semibold text-foreground"
                >
                  Demo passcode
                </label>
                <input
                  id="admin-passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value.slice(0, 40))}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-describedby={loginError ? "admin-login-error" : "admin-demo-hint"}
                  className="mt-2 h-12 w-full rounded-xl border bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {loginError ? (
                  <p id="admin-login-error" role="alert" className="mt-2 text-sm font-medium text-destructive">
                    {loginError}
                  </p>
                ) : (
                  <p id="admin-demo-hint" className="mt-2 text-xs text-muted-foreground">
                    Demo passcode: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">medivyx2025</code> — swap for real staff accounts before production.
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="mt-6 w-full rounded-full"
                  disabled={loggingIn || passcode.length === 0}
                >
                  {loggingIn ? (
                    <>
                      <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <Lock aria-hidden="true" className="size-4.5" />
                      Sign in
                    </>
                  )}
                </Button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Sessions last 8 hours — the cookie is HMAC-signed with the
                  passcode, so it can&apos;t be forged without knowing it. No
                  passwords are saved.
                </p>
              </form>
            </Reveal>
          </div>
        </section>
      </main>
    );
  }

  /* ---------------- Dashboard ---------------- */
  return (
    <main id="main-content">
      <PageHero
        eyebrow="Admin — Demo"
        title="Your pharmacy at a glance"
        description="A live demo of the analytics the website can collect — every WhatsApp click, request and search, counted."
      >
        <div className="flex flex-wrap gap-3">
          <Button onClick={refresh} variant="outline" className="rounded-full">
            <RefreshCw aria-hidden="true" className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={onLogout} variant="outline" className="rounded-full">
            <LogOut aria-hidden="true" className="size-4" />
            Log out
          </Button>
        </div>
      </PageHero>

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 pb-20 sm:px-6 sm:py-16">
          {/* Load error banner — fetch failures were previously silent */}
          {loadError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-honey-soft bg-honey-soft/30 p-4 text-sm text-accent-foreground"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Some data couldn&apos;t be refreshed</p>
                <p className="mt-0.5 text-sm">{loadError}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 rounded-full px-3 text-xs"
                onClick={() => {
                  setLoadError(null);
                  refresh();
                }}
              >
                <RefreshCw aria-hidden="true" className="size-3.5" />
                Retry
              </Button>
            </div>
          )}

          {/* The demo moment */}
          <Reveal>
            <div className="rounded-3xl bg-primary p-8 text-primary-foreground shadow-lg sm:p-10">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary-foreground/75">
                    <TrendingUp aria-hidden="true" className="size-4" />
                    This week
                  </p>
                  <p className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
                    {loading ? "…" : stats?.totals.pageViews ?? 0}
                  </p>
                  <p className="mt-1 text-lg text-primary-foreground/85">
                    people viewed your pharmacy.
                  </p>
                </div>
                <p className="max-w-xs rounded-2xl bg-white/10 p-4 text-sm leading-6 text-primary-foreground/80">
                  This is the demo moment — imagine showing this to the owner
                  each week. Real analytics plug into the same pipeline.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Stat cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))
              : cards.map((card, i) => (
                  <Reveal as="div" key={card.label} delay={(i % 4) as 0 | 1 | 2 | 3}>
                    <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl",
                          card.tone === "primary" && "bg-primary/10 text-primary",
                          card.tone === "green" && "bg-mint text-mint-foreground",
                          card.tone === "honey" && "bg-honey-soft text-accent-foreground"
                        )}
                      >
                        <card.icon aria-hidden="true" className="size-5" />
                      </span>
                      <p className="mt-3 font-display text-2xl font-semibold text-foreground">
                        {card.value}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {card.label}
                      </p>
                      {card.sub != null && (
                        <p className="mt-1 text-[0.6875rem] leading-4 text-muted-foreground/80">
                          {card.sub}
                        </p>
                      )}
                    </div>
                  </Reveal>
                ))}
          </div>

          {/* Medicine request queue */}
          <div className="mt-10">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    Medicine requests
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="hidden text-xs text-muted-foreground lg:block">
                      Status updates appear instantly on the public tracking
                      page.
                    </p>
                    {requests !== null &&
                      requests.length > 0 &&(
                        <ExportCsvButton dataset="requests" label="medicine requests" />
                      )}
                  </div>
                </div>

                {/* Queue search — find a request by reference, name or medicine */}
                {requests !== null && requests.length > 3 && (
                  <div className="mt-4 flex max-w-sm items-center gap-2 rounded-full border bg-background px-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <label htmlFor="requests-filter" className="sr-only">
                      Filter medicine requests
                    </label>
                    <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <input
                      id="requests-filter"
                      type="search"
                      value={requestFilter}
                      onChange={(e) => setRequestFilter(e.target.value.slice(0, 60))}
                      placeholder="Filter by reference, name, medicine…"
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                      autoComplete="off"
                    />
                  </div>
                )}

                {requests === null ? (
                  <div className="mt-5 space-y-3">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                ) : visibleRequests && visibleRequests.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <Search aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No requests match “{requestFilter.trim()}”
                    </p>
                    <button
                      type="button"
                      onClick={() => setRequestFilter("")}
                      className="mt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Clear the filter
                    </button>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <Inbox aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No requests yet
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      Submit one from the Request Medicine page and it will
                      appear here, ready to progress.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-3" aria-label="Medicine request queue">
                    {(visibleRequests ?? []).map((r) => {
                      const meta = STATUS_META[r.status];
                      const nextLabel = NEXT_STATUS_LABEL[r.status];
                      const busy = updatingRef === r.reference;
                      const canUndo = STATUS_ORDER.indexOf(r.status) > 0;
                      return (
                        <li
                          key={r.reference}
                          className="rounded-xl bg-background/70 p-4 ring-1 ring-border/60 transition-all duration-200 hover:ring-border"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                                  {r.reference}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold",
                                    meta.chip
                                  )}
                                >
                                  <meta.icon aria-hidden="true" className="size-3" />
                                  {meta.label}
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
                                  title={
                                    r.fulfilment === "delivery"
                                      ? "Delivery requested"
                                      : "Pickup requested"
                                  }
                                >
                                  {r.fulfilment === "delivery" ? (
                                    <Truck aria-hidden="true" className="size-3" />
                                  ) : (
                                    <Store aria-hidden="true" className="size-3" />
                                  )}
                                  {r.fulfilment === "delivery" ? "Delivery" : "Pickup"}
                                </span>
                              </p>
                              <p className="mt-1.5 truncate text-sm font-medium text-foreground/85">
                                {r.medicine}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {r.fullName} · {r.phone} ·{" "}
                                {formatDate(r.receivedAt)}
                                {r.prescriptionFileName
                                  ? ` · prescription attached (${r.prescriptionFileName})`
                                  : ""}
                              </p>
                              {r.notes && (
                                <p className="mt-1 line-clamp-2 rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                                  “{r.notes}”
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {canUndo && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-10 rounded-full px-3"
                                  onClick={() => void revertStatus(r)}
                                  disabled={busy}
                                  aria-label={`Move ${r.reference} back one step`}
                                  title="Undo — move this request back one step"
                                >
                                  {busy ? (
                                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                                  ) : (
                                    <Undo2 aria-hidden="true" className="size-3.5" />
                                  )}
                                  <span className="sr-only sm:not-sr-only">Undo</span>
                                </Button>
                              )}
                              {nextLabel ? (
                                <Button
                                  size="sm"
                                  className="h-10 rounded-full px-4"
                                  onClick={() => void advanceStatus(r)}
                                  disabled={busy}
                                >
                                  {busy ? (
                                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                                  ) : (
                                    <ArrowRight aria-hidden="true" className="size-3.5" />
                                  )}
                                  {nextLabel}
                                </Button>
                              ) : (
                                <span className="inline-flex h-10 items-center rounded-full bg-mint px-4 text-xs font-semibold text-mint-foreground">
                                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                                  Complete
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Reveal>
          </div>

          {/* Consultation bookings queue */}
          <div className="mt-10">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    Consultation bookings
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="hidden text-xs text-muted-foreground lg:block">
                      Free pharmacist consultations — confirm the slot, then
                      mark it done.
                    </p>
                    {bookings !== null &&
                      bookings.length > 0 &&(
                        <ExportCsvButton dataset="bookings" label="consultation bookings" />
                      )}
                  </div>
                </div>

                {/* Queue search — find a booking by reference, name or type */}
                {bookings !== null && bookings.length > 3 && (
                  <div className="mt-4 flex max-w-sm items-center gap-2 rounded-full border bg-background px-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <label htmlFor="bookings-filter" className="sr-only">
                      Filter consultation bookings
                    </label>
                    <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <input
                      id="bookings-filter"
                      type="search"
                      value={bookingFilter}
                      onChange={(e) => setBookingFilter(e.target.value.slice(0, 60))}
                      placeholder="Filter by reference, name, consult…"
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                      autoComplete="off"
                    />
                  </div>
                )}

                {bookings === null ? (
                  <div className="mt-5 space-y-3">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                ) : visibleBookings && visibleBookings.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <Search aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No bookings match “{bookingFilter.trim()}”
                    </p>
                    <button
                      type="button"
                      onClick={() => setBookingFilter("")}
                      className="mt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Clear the filter
                    </button>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <CalendarCheck aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No bookings yet
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      Book a consultation from the Book a Consultation page and
                      it will appear here, ready to confirm.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-3" aria-label="Consultation booking queue">
                    {(visibleBookings ?? []).map((b) => {
                      const meta = BOOKING_STATUS_META[b.status];
                      const nextLabel = BOOKING_NEXT_LABEL[b.status];
                      const busy = updatingBookingRef === b.reference;
                      const past = bookingPast(b);
                      const canUndo = BOOKING_STATUS_ORDER.indexOf(b.status) > 0;
                      return (
                        <li
                          key={b.reference}
                          className={cn(
                            "rounded-xl bg-background/70 p-4 ring-1 ring-border/60 transition-all duration-200 hover:ring-border",
                            past && b.status !== "completed" && "bg-honey-soft/25"
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                                  {b.reference}
                                </span>
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold",
                                    meta.chip
                                  )}
                                >
                                  <meta.icon aria-hidden="true" className="size-3" />
                                  {meta.label}
                                </span>
                                {past && b.status !== "completed" && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-honey-soft px-2.5 py-0.5 text-[0.6875rem] font-semibold text-accent-foreground">
                                    <Clock aria-hidden="true" className="size-3" />
                                    Time passed
                                  </span>
                                )}
                              </p>
                              <p className="mt-1.5 truncate text-sm font-medium text-foreground/85">
                                {consultLabel(b.consultType)}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {bookingSummary(b)} · {b.fullName} · {b.phone}
                              </p>
                              {b.notes && (
                                <p className="mt-1 line-clamp-2 rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                                  “{b.notes}”
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {canUndo && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-10 rounded-full px-3"
                                  onClick={() => void revertBooking(b)}
                                  disabled={busy}
                                  aria-label={`Move ${b.reference} back one step`}
                                  title="Undo — move this booking back one step"
                                >
                                  {busy ? (
                                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                                  ) : (
                                    <Undo2 aria-hidden="true" className="size-3.5" />
                                  )}
                                  <span className="sr-only sm:not-sr-only">Undo</span>
                                </Button>
                              )}
                              {nextLabel ? (
                                <Button
                                  size="sm"
                                  className="h-10 rounded-full px-4"
                                  onClick={() => void advanceBooking(b)}
                                  disabled={busy}
                                >
                                  {busy ? (
                                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                                  ) : (
                                    <ArrowRight aria-hidden="true" className="size-3.5" />
                                  )}
                                  {nextLabel}
                                </Button>
                              ) : (
                                <span className="inline-flex h-10 items-center rounded-full bg-mint px-4 text-xs font-semibold text-mint-foreground">
                                  <BadgeCheck aria-hidden="true" className="size-3.5" />
                                  Complete
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Reveal>
          </div>

          {/* Newsletter list */}
          <div className="mt-10">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    Newsletter list
                  </h2>
                  <div className="flex items-center gap-3">
                    <p className="hidden text-xs text-muted-foreground lg:block">
                      “Stay well” sign-ups from the footer — demo storage, no
                      emails sent.
                    </p>
                    {subscribers !== null &&
                      subscribers.length > 0 &&(
                        <ExportCsvButton dataset="newsletter" label="newsletter list" />
                      )}
                  </div>
                </div>

                {subscribers === null ? (
                  <div className="mt-5 space-y-3">
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                  </div>
                ) : subscribers.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <MailPlus aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No subscribers yet
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      Sign up from the footer of any page and the address will
                      appear here.
                    </p>
                  </div>
                ) : (
                  <ul
                    className="mt-5 grid gap-3 sm:grid-cols-2"
                    aria-label="Newsletter subscribers"
                  >
                    {subscribers.map((s) => (
                      <li
                        key={s.email}
                        className="flex items-center gap-3 rounded-xl bg-background/70 p-3.5 ring-1 ring-border/60"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-honey-soft text-accent-foreground">
                          <MailPlus aria-hidden="true" className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground/90">
                            {s.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(s.subscribedAt)} · {s.source}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
          </div>

          {/* Weekly chart + top products */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold">
                  Page views — last 7 days
                </h2>
                {loading ? (
                  <Skeleton className="mt-4 h-40 rounded-xl" />
                ) : (
                  <div className="mt-5 flex h-40 items-end gap-2.5" role="img" aria-label="Bar chart of daily page views for the last seven days">
                    {stats?.weekly.map((day) => (
                      <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                        <span className="text-xs font-semibold text-foreground/70">
                          {day.views}
                        </span>
                        <div
                          className="w-full rounded-t-lg bg-primary/80 transition-all"
                          style={{
                            height: `${Math.max(4, (day.views / maxWeek) * 100)}%`,
                          }}
                        />
                        <span className="text-[0.625rem] text-muted-foreground">
                          {day.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal delay={1}>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold">
                  Most viewed products
                </h2>
                {loading ? (
                  <Skeleton className="mt-4 h-40 rounded-xl" />
                ) : (
                  <ol className="mt-4 space-y-2.5">
                    {(stats?.topProducts ?? []).map((p, i) => (
                      <li
                        key={p.product}
                        className="flex items-center gap-3 rounded-xl bg-background/70 p-3 ring-1 ring-border/60"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium text-foreground/85">
                          {p.product}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {p.views} views
                        </span>
                      </li>
                    ))}
                    {(stats?.topProducts ?? []).length === 0 && (
                      <li className="py-8 text-center text-sm text-muted-foreground">
                        No product views yet — browse the catalogue and come
                        back.
                      </li>
                    )}
                  </ol>
                )}
              </div>
            </Reveal>
          </div>

          <p className="mt-8 rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
            Demo analytics — counts reset when the dev server restarts, and
            nothing personal is stored. In production this swaps to a real
            analytics provider behind the same events.
          </p>
        </div>
      </section>
    </main>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function bookingPast(b: BookingFull): boolean {
  const dt = new Date(`${b.date}T${b.slot}:00`);
  return !Number.isNaN(dt.getTime()) && dt.getTime() < Date.now();
}
