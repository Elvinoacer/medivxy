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
  ShoppingBag,
  Sparkles,
  TicketPercent,
  Trophy,
  MessageCircleQuestion,
  Trash2,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatKes } from "@/components/site/cart-provider";
import { products } from "@/lib/data";
import { track } from "@/lib/analytics";
import {
  bookingSummary,
  consultLabel,
} from "@/lib/booking-shared";
import { cn } from "@/lib/utils";
import { Boxes } from "lucide-react";
import type {
  BookingFull,
  BookingStatus,
  MedicineRequestFull,
  MedicineRequestStatus,
  NewsletterSubscriber,
  OrderFull,
  OrderStatus,
} from "@/lib/types";
import type { LoyaltyAccountView } from "@/lib/loyalty";
import type { Question as AdminQuestion } from "@/lib/questions";

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

/* ── Shop orders ── */

const ORDER_STATUS_ORDER: OrderStatus[] = [
  "received",
  "reviewing",
  "preparing",
  "ready",
  "completed",
];

const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; chip: string; icon: typeof ClipboardCheck }
> = {
  received: {
    label: "Received",
    chip: "bg-muted text-muted-foreground",
    icon: Inbox,
  },
  reviewing: {
    label: "Rx review",
    chip: "bg-honey-soft text-accent-foreground",
    icon: FileText,
  },
  preparing: {
    label: "Preparing",
    chip: "bg-primary/10 text-primary",
    icon: ClipboardCheck,
  },
  ready: {
    label: "Ready",
    chip: "bg-honey-soft text-accent-foreground",
    icon: PackageCheck,
  },
  completed: {
    label: "Completed",
    chip: "bg-mint text-mint-foreground",
    icon: BadgeCheck,
  },
};

const ORDER_NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  reviewing: "Start review",
  preparing: "Approve & prepare",
  ready: "Mark ready",
  completed: "Mark completed",
};

/** Status ladder for an order — non-Rx orders skip the pharmacist-review step
 *  (mirrors the public ShopOrderTimeline, which never shows that step for them). */
function statusFlowFor(order: OrderFull): OrderStatus[] {
  return order.hasPrescriptionItems
    ? ORDER_STATUS_ORDER
    : ORDER_STATUS_ORDER.filter((s) => s !== "reviewing");
}

/** Position of the order's status on its ladder. Orders parked on a step that
 *  isn't on their ladder (e.g. a non-Rx order manually set to "reviewing")
 *  anchor to the closest earlier step so the buttons still work. */
function orderFlowIndex(order: OrderFull): number {
  const flow = statusFlowFor(order);
  const idx = flow.indexOf(order.status);
  if (idx !== -1) return idx;
  return Math.max(0, ORDER_STATUS_ORDER.indexOf(order.status) - 1);
}

/** Small CSV download action for a staff queue panel (renders when data exists). */
function ExportCsvButton({
  dataset,
  label,
}: {
  dataset: "bookings" | "requests" | "newsletter" | "orders";
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

/* ── Stock levels panel body ─────────────────────────────────────── */

const LOW_THRESHOLD = 5;

function StockPanelBody({
  levels,
  filter,
  updatingSlug,
  onSet,
  onClearFilter,
}: {
  levels: Record<string, number>;
  filter: string;
  updatingSlug: string | null;
  onSet: (slug: string, level: number) => void;
  onClearFilter: () => void;
}) {
  const managed = products.filter((p) => p.availability !== "ask");
  const q = filter.trim().toLowerCase();
  const rows = managed
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    .map((p) => {
      const level = levels[p.slug] ?? 0;
      return { product: p, level };
    })
    .sort((a, b) => {
      // Out of stock first, then low, then alphabetical.
      const band = (l: number) => (l === 0 ? 0 : l <= LOW_THRESHOLD ? 1 : 2);
      return band(a.level) - band(b.level) || a.product.name.localeCompare(b.product.name);
    });

  const outCount = managed.filter((p) => (levels[p.slug] ?? 0) === 0).length;
  const lowCount = managed.filter((p) => {
    const l = levels[p.slug] ?? 0;
    return l > 0 && l <= LOW_THRESHOLD;
  }).length;

  if (rows.length === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed p-6 text-center">
        <Search aria-hidden="true" className="mx-auto size-7 text-muted-foreground/60" />
        <p className="mt-2 text-sm font-medium text-foreground">
          No products match “{filter.trim()}”
        </p>
        <button
          type="button"
          onClick={onClearFilter}
          className="mt-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Clear the filter
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground">
          {managed.length} tracked
        </span>
        {lowCount > 0 && (
          <span className="rounded-full bg-honey-soft px-2.5 py-1 font-semibold text-accent-foreground">
            {lowCount} low
          </span>
        )}
        {outCount > 0 && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-semibold text-destructive">
            {outCount} out of stock
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          Ask-to-order items aren&apos;t tracked here.
        </span>
      </div>
      <ul
        className="mt-3 max-h-96 space-y-2 overflow-y-auto scrollbar-thin pr-1"
        aria-label="Stock levels by product"
      >
        {rows.map(({ product, level }) => {
          const busy = updatingSlug === product.slug;
          const out = level === 0;
          const low = level > 0 && level <= LOW_THRESHOLD;
          return (
            <li
              key={product.slug}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl bg-background/70 p-3 ring-1 ring-border/60 transition-all hover:ring-border",
                out && "ring-destructive/30 bg-destructive/5"
              )}
            >
              <div className="relative hidden size-10 shrink-0 overflow-hidden rounded-lg border bg-secondary/60 sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {product.name}
                  {product.prescriptionRequired && (
                    <span className="ml-1.5 rounded-full bg-foreground/85 px-1.5 py-0.5 text-[0.625rem] font-semibold text-background">
                      Rx
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.category}
                  {out ? " · blocked at checkout" : low ? " · shows “Only N left”" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSet(product.slug, level - 1)}
                  disabled={busy || level === 0}
                  aria-label={`Decrease stock of ${product.name}`}
                  className="flex size-8 items-center justify-center rounded-full border text-foreground/70 transition-colors hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden="true" className="text-base leading-none font-semibold">
                    −
                  </span>
                </button>
                <span
                  aria-live="polite"
                  className={cn(
                    "min-w-11 rounded-full px-2 py-1 text-center text-sm font-bold tabular-nums",
                    out
                      ? "bg-destructive/10 text-destructive"
                      : low
                        ? "bg-honey-soft text-accent-foreground"
                        : "bg-mint text-mint-foreground"
                  )}
                >
                  {busy ? (
                    <Loader2 aria-hidden="true" className="mx-auto size-3.5 animate-spin" />
                  ) : (
                    level
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => onSet(product.slug, level + 1)}
                  disabled={busy}
                  aria-label={`Increase stock of ${product.name}`}
                  className="flex size-8 items-center justify-center rounded-full border text-foreground/70 transition-colors hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden="true" className="text-base leading-none font-semibold">
                    +
                  </span>
                </button>
                {out && (
                  <button
                    type="button"
                    onClick={() => onSet(product.slug, 12)}
                    disabled={busy}
                    className="ml-1 rounded-full border px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    Restock
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
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
  const [orders, setOrders] = useState<OrderFull[] | null>(null);
  const [updatingOrderRef, setUpdatingOrderRef] = useState<string | null>(null);

  // MediPoints members (server-side balances, phone-keyed).
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<
    LoyaltyAccountView[] | null
  >(null);

  // Customer product questions (answer / dismiss from this dashboard).
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [questionFilter, setQuestionFilter] = useState("");

  // Stock levels (staff-managed store) — feeds the catalogue "Only N left"
  // chips and the checkout availability check.
  const [stockLevels, setStockLevels] = useState<Record<string, number> | null>(null);
  const [updatingStockSlug, setUpdatingStockSlug] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState("");

  // Queue filters + load errors — previously a failed fetch silently kept
  // stale data with no hint that anything was wrong.
  const [requestFilter, setRequestFilter] = useState("");
  const [bookingFilter, setBookingFilter] = useState("");
  const [orderFilter, setOrderFilter] = useState("");
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

  async function loadOrders() {
    try {
      const res = await fetch("/api/admin-orders", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { orders?: OrderFull[] };
        setOrders(data.orders ?? []);
        setLoadError(null);
      } else {
        setLoadError("The orders queue failed to load — try Refresh.");
      }
    } catch {
      setLoadError("The orders queue failed to load — try Refresh.");
    }
  }

  async function loadStock() {
    try {
      const res = await fetch("/api/admin-stock", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { levels?: Record<string, number> };
        setStockLevels(data.levels ?? {});
      }
    } catch {
      // stock panel shows skeletons — silent
    }
  }

  async function loadLoyalty() {
    try {
      const res = await fetch("/api/admin-loyalty", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { accounts?: LoyaltyAccountView[] };
        setLoyaltyAccounts(data.accounts ?? []);
      }
    } catch {
      // loyalty panel keeps skeletons — silent
    }
  }

  async function loadQuestions() {
    try {
      const res = await fetch("/api/admin-questions", { cache: "no-store" });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { questions?: AdminQuestion[] };
        setQuestions(data.questions ?? []);
      }
    } catch {
      // questions panel keeps skeletons — silent
    }
  }

  /** Staff action: publish an answer (appears on the product page). */
  async function submitAnswer(id: string, answer: string) {
    if (answer.trim().length < 2) {
      toast.error("Answers need a couple of characters at least.");
      return;
    }
    setAnsweringId(id);
    try {
      const res = await fetch("/api/admin-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, answer: answer.trim(), answeredBy: "Pharmacist — Medivyx" }),
      });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { question?: AdminQuestion };
        if (data.question) {
          setQuestions((list) =>
            (list ?? []).map((q) => (q.id === data.question!.id ? data.question! : q))
          );
          toast.success(`Answer published — ${data.question.slug}`, {
            description: "It now shows publicly on the product page.",
          });
        }
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error("Couldn't publish that answer", {
          description: data.error ?? "Please try again.",
        });
      }
    } catch {
      toast.error("Couldn't publish that answer", { description: "Network error." });
    } finally {
      setAnsweringId(null);
    }
  }

  /** Staff action: dismiss a question (spam/duplicate). */
  async function dismissQ(id: string) {
    setAnsweringId(id);
    try {
      const res = await fetch("/api/admin-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dismiss: true }),
      });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        setQuestions((list) => (list ?? []).filter((q) => q.id !== id));
        toast("Question dismissed");
      } else {
        toast.error("Couldn't dismiss that question — please try again.");
      }
    } catch {
      toast.error("Couldn't dismiss that question — network error.");
    } finally {
      setAnsweringId(null);
    }
  }

  /** Staff action: set one product's stock level (optimistic + toast on fail). */
  async function setStockLevel(slug: string, level: number) {
    const clamped = Math.max(0, Math.min(999, Math.round(level)));
    const name = products.find((p) => p.slug === slug)?.name ?? slug;
    if (stockLevels && stockLevels[slug] === clamped) return;
    setUpdatingStockSlug(slug);
    // Optimistic update — the UI must feel instant for a busy pharmacist.
    setStockLevels((prev) => (prev ? { ...prev, [slug]: clamped } : prev));
    try {
      const res = await fetch("/api/admin-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, level: clamped }),
      });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { levels?: Record<string, number> };
        if (data.levels) setStockLevels(data.levels);
        if (clamped === 0) {
          toast(`${name} marked out of stock`, {
            description: "Catalogue cards now show “Out of stock” and checkout blocks it.",
          });
        }
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(`Couldn't update ${name}`, {
          description: data.error ?? "Please try again.",
        });
        void loadStock(); // revert to server truth
      }
    } catch {
      toast.error(`Couldn't update ${name}`, { description: "Network error." });
      void loadStock();
    } finally {
      setUpdatingStockSlug(null);
    }
  }

  useEffect(() => {
    if (auth !== "open") return;
    const load = () => {
      void loadStats();
      void loadRequests();
      void loadBookings();
      void loadSubscribers();
      void loadOrders();
      void loadStock();
      void loadLoyalty();
      void loadQuestions();
    };
    load();
  }, [auth]);

  function refresh() {
    void loadStats();
    void loadRequests();
    void loadBookings();
    void loadSubscribers();
    void loadOrders();
    void loadStock();
    void loadLoyalty();
    void loadQuestions();
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

  /** Status setter for shop orders (advance OR undo). */
  async function setOrderStatus(
    order: OrderFull,
    next: OrderStatus,
    undoing = false
  ) {
    if (next === order.status) return;
    setUpdatingOrderRef(order.reference);
    try {
      const res = await fetch("/api/admin-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: order.reference, status: next }),
      });
      if (res.status === 401) {
        setAuth("locked");
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { order?: OrderFull };
        if (data.order) {
          setOrders((list) =>
            (list ?? []).map((o) =>
              o.reference === data.order!.reference ? data.order! : o
            )
          );
          toast.success(
            undoing
              ? `${order.reference} moved back to "${ORDER_STATUS_META[next].label}"`
              : `${order.reference} marked "${ORDER_STATUS_META[next].label}"`,
            { description: "The public tracking page updates within 30 seconds." }
          );
        }
      } else {
        toast.error(`Couldn't update ${order.reference} — please try again.`);
      }
    } catch {
      toast.error(`Couldn't update ${order.reference} — network error.`);
    } finally {
      setUpdatingOrderRef(null);
    }
  }

  function advanceOrder(order: OrderFull) {
    const flow = statusFlowFor(order);
    const next = flow[Math.min(orderFlowIndex(order) + 1, flow.length - 1)];
    return setOrderStatus(order, next);
  }

  function revertOrder(order: OrderFull) {
    const flow = statusFlowFor(order);
    const prev = flow[Math.max(orderFlowIndex(order) - 1, 0)];
    return setOrderStatus(order, prev, true);
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

  const visibleOrders = useMemo(() => {
    if (!orders) return null;
    const q = orderFilter.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [
        o.reference,
        o.fullName,
        o.phone,
        o.items.map((i) => i.name).join(" "),
        o.notes,
        o.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [orders, orderFilter]);

  const visibleQuestions = useMemo(() => {
    if (!questions) return null;
    const q = questionFilter.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((item) =>
      [item.id, item.slug, item.askedBy, item.question, item.answer]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [questions, questionFilter]);

  const pendingQuestions = questions?.filter((q) => !q.answer).length ?? 0;

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
        { icon: ShoppingBag, label: "Shop orders", value: orders?.length ?? 0, tone: "green", sub: orders ? formatKes(orders.reduce((n, o) => n + o.total, 0)) + " total" : undefined },
        {
          icon: Sparkles,
          label: "MediPoints members",
          value: loyaltyAccounts?.length ?? 0,
          tone: "green",
          sub: loyaltyAccounts
            ? `${loyaltyAccounts.reduce((n, a) => n + a.points, 0).toLocaleString("en-KE")} pts outstanding`
            : undefined,
        },
        {
          icon: MessageCircleQuestion,
          label: "Questions pending",
          value: pendingQuestions,
          tone: pendingQuestions > 0 ? "honey" : "primary",
          sub: questions ? `${questions.length} asked in total` : undefined,
        },
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

          {/* Commerce insights — funnel, promo usage and loyalty at a glance.
              Built from the SAME events/objects the dashboard already loads:
              stats.events (funnel + engagement) + orders (promo/points) +
              loyaltyAccounts (programme totals). No extra fetch. */}
          <CommerceInsights
            events={stats?.events ?? {}}
            orders={orders}
            loyaltyAccounts={loyaltyAccounts}
            questions={questions}
          />

          {/* Shop orders queue */}
          <div className="mt-10">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    Shop orders
                  </h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="hidden text-xs text-muted-foreground lg:block">
                      ORD-XXXX references — status updates appear instantly on
                      the public tracking page.
                    </p>
                    {orders !== null && orders.length > 0 && (
                      <ExportCsvButton dataset="orders" label="shop orders" />
                    )}
                  </div>
                </div>

                {/* Queue search */}
                {orders !== null && orders.length > 3 && (
                  <div className="mt-4 flex max-w-sm items-center gap-2 rounded-full border bg-background px-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <label htmlFor="orders-filter" className="sr-only">
                      Filter shop orders
                    </label>
                    <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <input
                      id="orders-filter"
                      type="search"
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value.slice(0, 60))}
                      placeholder="Filter by reference, name, item…"
                      className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                      autoComplete="off"
                    />
                  </div>
                )}

                {orders === null ? (
                  <div className="mt-5 space-y-3">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                  </div>
                ) : visibleOrders && visibleOrders.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <Search aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No orders match “{orderFilter.trim()}”
                    </p>
                    <button
                      type="button"
                      onClick={() => setOrderFilter("")}
                      className="mt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Clear the filter
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <ShoppingBag aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No shop orders yet
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      Orders placed through the shop checkout appear here with
                      their basket, payment method and status.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-3" aria-label="Shop order queue">
                    {(visibleOrders ?? []).map((o) => {
                      const meta = ORDER_STATUS_META[o.status];
                      const flow = statusFlowFor(o);
                      const flowIdx = orderFlowIndex(o);
                      const nextStatus =
                        flowIdx < flow.length - 1 ? flow[flowIdx + 1] : null;
                      const nextLabel = nextStatus
                        ? nextStatus === "preparing" && !o.hasPrescriptionItems
                          ? "Start packing"
                          : ORDER_NEXT_LABEL[nextStatus]
                        : undefined;
                      const busy = updatingOrderRef === o.reference;
                      const canUndo = flowIdx > 0;
                      return (
                        <li
                          key={o.reference}
                          className="rounded-xl bg-background/70 p-4 ring-1 ring-border/60 transition-all duration-200 hover:ring-border"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
                                  {o.reference}
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
                                    o.fulfilment === "delivery"
                                      ? "Delivery requested"
                                      : "Pickup requested"
                                  }
                                >
                                  {o.fulfilment === "delivery" ? (
                                    <Truck aria-hidden="true" className="size-3" />
                                  ) : (
                                    <Store aria-hidden="true" className="size-3" />
                                  )}
                                  {o.fulfilment === "delivery" ? "Delivery" : "Pickup"}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-0.5 text-[0.6875rem] font-semibold text-mint-foreground">
                                  {formatKes(o.total)}
                                </span>
                                {o.discount > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full bg-honey-soft px-2.5 py-0.5 text-[0.6875rem] font-semibold text-accent-foreground"
                                    title={`Promo ${o.promoCode} applied — saved ${formatKes(o.discount)}`}
                                  >
                                    <TicketPercent aria-hidden="true" className="size-3" />
                                    {o.promoCode} −{formatKes(o.discount)}
                                  </span>
                                )}
                                {o.loyaltyDiscount > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                                    title={`${o.pointsRedeemed} MediPoints redeemed for ${formatKes(o.loyaltyDiscount)} off`}
                                  >
                                    <Sparkles aria-hidden="true" className="size-3" />
                                    {o.pointsRedeemed} pts −{formatKes(o.loyaltyDiscount)}
                                  </span>
                                )}
                                {o.pointsEarned > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-emerald-700 dark:border-emerald-700/50 dark:text-emerald-300"
                                    title={`Order earned ${o.pointsEarned} MediPoints`}
                                  >
                                    <Sparkles aria-hidden="true" className="size-3" />
                                    +{o.pointsEarned} pts
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium",
                                    o.paymentStatus === "paid-demo"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                  title={
                                    o.paymentMethod === "mpesa"
                                      ? "M-Pesa"
                                      : o.paymentMethod === "card"
                                        ? "Card"
                                        : "On collection"
                                  }
                                >
                                  {o.paymentStatus === "paid-demo"
                                    ? o.paymentMethod === "mpesa"
                                      ? "M-Pesa · Paid"
                                      : "Card · Paid"
                                    : "Payment pending"}
                                </span>
                              </p>
                              <p className="mt-1.5 truncate text-sm font-medium text-foreground/85">
                                {o.items
                                  .map((i) => `${i.name} ×${i.quantity}`)
                                  .join(", ")}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {o.fullName} · {o.phone} · {formatDate(o.placedAt)}
                                {o.fulfilment === "delivery" && o.area
                                  ? ` · ${o.area}`
                                  : ""}
                                {o.prescriptionFileName
                                  ? ` · prescription attached (${o.prescriptionFileName})`
                                  : ""}
                              </p>
                              {o.fulfilment === "delivery" && o.address && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  Deliver to: {o.address}
                                  {o.area ? ` · ${o.area}` : ""}
                                  {o.deliveryFee > 0
                                    ? ` · fee ${formatKes(o.deliveryFee)}`
                                    : o.fulfilment === "delivery"
                                      ? " · fee TBC"
                                      : ""}
                                </p>
                              )}
                              {o.notes && (
                                <p className="mt-1 line-clamp-2 rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                                  “{o.notes}”
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {canUndo && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-10 rounded-full px-3"
                                  onClick={() => void revertOrder(o)}
                                  disabled={busy}
                                  aria-label={`Move ${o.reference} back one step`}
                                  title="Undo — move this order back one step"
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
                                  onClick={() => void advanceOrder(o)}
                                  disabled={busy}
                                >
                                  {busy ? (
                                    <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
                                  ) : (
                                    <ArrowRight aria-hidden="true" className="size-3.5" />
                                  )}
                                  {nextLabel}
                                </Button>
                              ) : null}
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

          {/* Stock levels */}
          <div className="mt-10">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Boxes aria-hidden="true" className="size-4.5" />
                      </span>
                      Stock levels
                    </span>
                  </h2>
                  <label className="relative">
                    <span className="sr-only">Filter stock by product name</span>
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="search"
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      placeholder="Filter products…"
                      className="h-9 w-48 rounded-full border bg-background pl-9 pr-3 text-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Levels feed the catalogue “Only N left” chips and block
                  checkout for out-of-stock items. Orders decrement stock
                  automatically.
                </p>

                {stockLevels === null ? (
                  <div className="mt-5 space-y-3">
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                    <Skeleton className="h-14 rounded-xl" />
                  </div>
                ) : (
                  <StockPanelBody
                    levels={stockLevels}
                    filter={stockFilter}
                    updatingSlug={updatingStockSlug}
                    onSet={setStockLevel}
                    onClearFilter={() => setStockFilter("")}
                  />
                )}
              </div>
            </Reveal>
          </div>

          {/* MediPoints members — the loyalty programme at a glance */}
          <div className="mt-10">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-mint text-mint-foreground">
                        <Trophy aria-hidden="true" className="size-4.5" />
                      </span>
                      MediPoints members
                    </span>
                  </h2>
                  <p className="hidden text-xs text-muted-foreground lg:block">
                    Balances live server-side against the customer&apos;s phone —
                    earned 1 pt per KES 100 spent.
                  </p>
                </div>

                {loyaltyAccounts === null ? (
                  <div className="mt-5 space-y-3">
                    <Skeleton className="h-16 rounded-xl" />
                    <Skeleton className="h-16 rounded-xl" />
                  </div>
                ) : loyaltyAccounts.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <Sparkles aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No members yet
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      The first shop order creates an account automatically —
                      earn 1 pt per KES 100 spent, +50 on a first order.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[560px] text-sm">
                      <caption className="sr-only">
                        MediPoints accounts by lifetime points
                      </caption>
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th scope="col" className="pb-2 pr-4 font-semibold">Phone</th>
                          <th scope="col" className="pb-2 pr-4 font-semibold">Tier</th>
                          <th scope="col" className="pb-2 pr-4 text-right font-semibold">Points</th>
                          <th scope="col" className="pb-2 pr-4 text-right font-semibold">Lifetime</th>
                          <th scope="col" className="pb-2 pr-4 text-right font-semibold">Orders</th>
                          <th scope="col" className="pb-2 font-semibold">Next tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {loyaltyAccounts.map((a) => (
                          <tr
                            key={a.phone}
                            className="transition-colors hover:bg-secondary/40"
                          >
                            <td className="py-2.5 pr-4 font-mono text-[0.8125rem] font-semibold text-foreground">
                              {a.phone}
                            </td>
                            <td className="py-2.5 pr-4">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wider",
                                  a.tier === "gold"
                                    ? "bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950"
                                    : a.tier === "silver"
                                      ? "bg-gradient-to-r from-slate-300 to-zinc-400 text-slate-900"
                                      : "bg-secondary text-secondary-foreground"
                                )}
                              >
                                <Sparkles aria-hidden="true" className="size-3" />
                                {a.tierLabel}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-foreground">
                              {a.points.toLocaleString("en-KE")}
                            </td>
                            <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                              {a.lifetimePoints.toLocaleString("en-KE")}
                            </td>
                            <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                              {a.orders}
                            </td>
                            <td className="py-2.5 text-xs text-muted-foreground">
                              {a.nextAt !== null
                                ? `${Math.max(0, a.nextAt - a.lifetimePoints).toLocaleString("en-KE")} pts to ${a.nextLabel}`
                                : "Top tier"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-3 text-[0.6875rem] leading-5 text-muted-foreground">
                  Redeemable in blocks of 100 pts (1 pt = KES 1) at checkout,
                  capped at the basket subtotal. Accounts are created on a
                  customer&apos;s first order — no sign-up needed.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Customer questions — answer from here, appears on product pages */}
          <div className="mt-10">
            <Reveal>
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MessageCircleQuestion aria-hidden="true" className="size-4.5" />
                      </span>
                      Customer questions
                      {pendingQuestions > 0 && (
                        <span className="rounded-full bg-honey-soft px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                          {pendingQuestions} pending
                        </span>
                      )}
                    </span>
                  </h2>
                  {questions !== null && questions.length > 3 && (
                    <div className="flex max-w-xs items-center gap-2 rounded-full border bg-background px-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                      <label htmlFor="questions-filter" className="sr-only">
                        Filter questions
                      </label>
                      <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      <input
                        id="questions-filter"
                        type="search"
                        value={questionFilter}
                        onChange={(e) => setQuestionFilter(e.target.value.slice(0, 60))}
                        placeholder="Filter by product, question…"
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                        autoComplete="off"
                      />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Answers publish instantly to the product page — pending
                  questions show there as “awaiting the pharmacist”.
                </p>

                {questions === null ? (
                  <div className="mt-5 space-y-3">
                    <Skeleton className="h-28 rounded-xl" />
                    <Skeleton className="h-28 rounded-xl" />
                  </div>
                ) : visibleQuestions && visibleQuestions.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
                    <MessageCircleQuestion aria-hidden="true" className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      No questions{questionFilter.trim() ? ` match “${questionFilter.trim()}”` : " yet"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      Customers ask from any product page — the question lands
                      here for the pharmacist to answer.
                    </p>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-3" aria-label="Customer questions">
                    {(visibleQuestions ?? []).map((q) => (
                      <QuestionRow
                        key={q.id}
                        q={q}
                        busy={answeringId === q.id}
                        onAnswer={submitAnswer}
                        onDismiss={dismissQ}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </Reveal>
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

/* ── Customer question row (answer inline) ───────────────────────── */

function QuestionRow({
  q,
  busy,
  onAnswer,
  onDismiss,
}: {
  q: AdminQuestion;
  busy: boolean;
  onAnswer: (id: string, answer: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}) {
  const [answer, setAnswer] = useState(q.answer);
  const productName = products.find((p) => p.slug === q.slug)?.name ?? q.slug;
  const answered = !!q.answer;

  return (
    <li
      className={cn(
        "rounded-xl bg-background/70 p-4 ring-1 ring-border/60 transition-all duration-200 hover:ring-border",
        !answered && "ring-honey-soft/70"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
          {q.id}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold",
            answered ? "bg-primary/10 text-primary" : "bg-honey-soft text-accent-foreground"
          )}
        >
          {answered ? "Answered" : "Pending"}
        </span>
        <a
          href={`/products/${q.slug}#qa-heading`}
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {productName} →
        </a>
        <span className="text-[0.6875rem] text-muted-foreground">
          {q.askedBy} · {formatDate(q.createdAt)}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
        “{q.question}”
      </p>

      <div className="mt-3">
        <label htmlFor={`answer-${q.id}`} className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Pharmacist answer
        </label>
        <Textarea
          id={`answer-${q.id}`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value.slice(0, 1500))}
          placeholder="Write the public answer (shows on the product page)…"
          rows={3}
          className="mt-1.5 resize-none text-sm"
          aria-describedby={`answer-count-${q.id}`}
        />
        <p id={`answer-count-${q.id}`} className="mt-1 text-right text-[0.6875rem] tabular-nums text-muted-foreground">
          {answer.length}/1500
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.6875rem] text-muted-foreground">
            {answered && q.answeredBy
              ? `Currently answered by ${q.answeredBy} · ${formatDate(q.answeredAt ?? q.createdAt)}`
              : "Not answered yet — the product page shows it as pending."}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-full px-3 text-xs"
              onClick={() => void onDismiss(q.id)}
              disabled={busy}
              aria-label={`Dismiss question ${q.id}`}
              title="Remove this question entirely (spam/duplicate)"
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Dismiss
            </Button>
            <Button
              size="sm"
              className="h-9 rounded-full px-4 text-xs"
              onClick={() => void onAnswer(q.id, answer)}
              disabled={busy || answer.trim().length < 2}
            >
              {busy ? (
                <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
              ) : (
                <BadgeCheck aria-hidden="true" className="size-3.5" />
              )}
              {answered ? "Update answer" : "Publish answer"}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── Commerce insights panel ───────────────────────────────────── */

function CommerceInsights({
  events,
  orders,
  loyaltyAccounts,
  questions,
}: {
  events: Record<string, number>;
  orders: OrderFull[] | null;
  loyaltyAccounts: LoyaltyAccountView[] | null;
  questions: AdminQuestion[] | null;
}) {
  // ── Shop funnel: view → basket → checkout → order (demo events) ──
  const funnel = [
    { label: "Product views", event: "product_view" },
    { label: "Added to basket", event: "add_to_cart" },
    { label: "Checkout started", event: "checkout_start" },
    { label: "Orders placed", event: "order_placed" },
  ].map((s) => ({ ...s, value: events[s.event] ?? 0 }));
  const funnelMax = Math.max(1, ...funnel.map((s) => s.value));

  // Conversion step→step (placed / started) — the number owners care about.
  const started = funnel[2].value;
  const placed = funnel[3].value;
  const conversion = started > 0 ? Math.round((placed / started) * 100) : null;

  // ── Promo usage from REAL order rows (not just clicks) ──
  const promoUse = new Map<string, { count: number; kes: number }>();
  for (const o of orders ?? []) {
    if (!o.promoCode) continue;
    const cur = promoUse.get(o.promoCode) ?? { count: 0, kes: 0 };
    cur.count += 1;
    cur.kes += o.discount;
    promoUse.set(o.promoCode, cur);
  }
  const promoRows = [...promoUse.entries()].sort(
    (a, b) => b[1].kes - a[1].kes
  );
  const promoCopies = events["promo_copy"] ?? 0;
  const promoApplied = events["promo_applied"] ?? 0;

  // ── Loyalty totals ──
  const members = loyaltyAccounts?.length ?? 0;
  const outstanding = loyaltyAccounts?.reduce((n, a) => n + a.points, 0) ?? 0;
  const redeemedKes = orders?.reduce((n, o) => n + o.loyaltyDiscount, 0) ?? 0;
  const redeemedPts = orders?.reduce((n, o) => n + o.pointsRedeemed, 0) ?? 0;
  const earnedPts = orders?.reduce((n, o) => n + o.pointsEarned, 0) ?? 0;

  // ── Engagement extras ──
  const questionsAsked = events["question_asked"] ?? 0;
  const qAnswered = questions?.filter((q) => q.answer).length ?? 0;
  const reorders = events["reorder"] ?? 0;

  const hasOrders = (orders?.length ?? 0) > 0;

  return (
    <div className="mt-10">
      <Reveal>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              <span className="inline-flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingUp aria-hidden="true" className="size-4.5" />
                </span>
                Commerce insights
              </span>
            </h2>
            <p className="hidden text-xs text-muted-foreground lg:block">
              Shop funnel from demo analytics events · promo and points from the
              live order queue — refreshes with the Refresh button.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {/* Funnel */}
            <div className="rounded-2xl border bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Shop funnel
              </p>
              <ul className="mt-3 space-y-3" aria-label="Shop funnel steps">
                {funnel.map((s) => (
                  <li key={s.event}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{s.label}</span>
                      <span className={cn("font-semibold tabular-nums", s.value > 0 ? "text-foreground" : "text-muted-foreground")}>
                        {s.value.toLocaleString("en-KE")}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-primary/10">
                      {s.value > 0 ? (
                        <div
                          className="insights-bar h-full rounded-full bg-gradient-to-r from-primary to-emerald-500"
                          style={{ width: `${Math.max(6, (s.value / funnelMax) * 100)}%` }}
                          title={`${s.value} events`}
                        />
                      ) : (
                        <div className="insights-zero h-full w-1.5 rounded-full bg-primary/30" aria-hidden="true" />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {conversion !== null && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-mint/60 px-3 py-2 text-xs font-semibold text-mint-foreground">
                  <TrendingUp aria-hidden="true" className="size-3.5 shrink-0" />
                  {conversion}% of started checkouts become orders
                  {reorders > 0 && ` · ${reorders} reorder${reorders === 1 ? "" : "s"}`}
                </p>
              )}
            </div>

            {/* Promo + loyalty */}
            <div className="grid gap-5">
              {/* Promo usage */}
              <div className="rounded-2xl border bg-background/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Promo codes on real orders
                </p>
                {promoRows.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No promo orders yet — codes copied {promoCopies.toLocaleString("en-KE")}×
                    and applied at checkout {promoApplied.toLocaleString("en-KE")}×.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2" aria-label="Promo code usage">
                    {promoRows.map(([code, u]) => (
                      <li
                        key={code}
                        className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <TicketPercent aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                          <span className="font-mono font-semibold tracking-wide text-foreground">
                            {code}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {u.count} order{u.count === 1 ? "" : "s"}
                          </span>
                          <span className="font-semibold tabular-nums text-primary">
                            −{formatKes(u.kes)}
                          </span>
                        </span>
                      </li>
                    ))}
                    <li className="pt-1 text-[0.6875rem] text-muted-foreground">
                      Copies {promoCopies.toLocaleString("en-KE")} · applied at
                      checkout {promoApplied.toLocaleString("en-KE")} (event counts).
                    </li>
                  </ul>
                )}
              </div>

              {/* Loyalty totals */}
              <div className="rounded-2xl border border-emerald-200/60 bg-background/60 p-4 dark:border-emerald-800/30">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles aria-hidden="true" className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                  MediPoints programme
                </p>
                {hasOrders || members > 0 ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Members</dt>
                      <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
                        {members}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Points outstanding</dt>
                      <dd className="font-display text-xl font-semibold tabular-nums text-foreground">
                        {outstanding.toLocaleString("en-KE")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Earned on orders</dt>
                      <dd className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        +{earnedPts.toLocaleString("en-KE")} pts
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Redeemed</dt>
                      <dd className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        −{redeemedPts.toLocaleString("en-KE")} pts
                        {redeemedKes > 0 && (
                          <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                            ({formatKes(redeemedKes)} back to customers)
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">
                    No members yet — the first shop order creates the first account.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Engagement strip */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center rounded-full border bg-background px-3 py-1.5 font-semibold",
                questionsAsked > 0 ? "text-foreground/85" : "text-muted-foreground"
              )}
            >
              <MessageCircleQuestion aria-hidden="true" className={cn("mr-1.5 inline size-3.5", questionsAsked > 0 && "text-primary")} />
              {questionsAsked.toLocaleString("en-KE")} questions asked
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border bg-background px-3 py-1.5 font-semibold",
                qAnswered > 0 ? "text-foreground/85" : "text-muted-foreground"
              )}
            >
              {qAnswered} answered
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border bg-background px-3 py-1.5 font-semibold",
                reorders > 0 ? "text-foreground/85" : "text-muted-foreground"
              )}
            >
              <Sparkles aria-hidden="true" className={cn("mr-1.5 inline size-3.5", reorders > 0 && "text-primary")} />
              {reorders.toLocaleString("en-KE")} reorders
            </span>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
