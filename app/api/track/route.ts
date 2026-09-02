import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

/**
 * Lightweight demo analytics (research.md §25).
 * Events are held in memory (resets on restart — honest demo behaviour)
 * and aggregated for the /admin dashboard.
 */

interface TrackedEvent {
  event: string;
  data: Record<string, string | number | boolean>;
  ts: number;
  path: string;
}

const globalStore = globalThis as unknown as { __medivyxEvents?: TrackedEvent[] };
const events: TrackedEvent[] = (globalStore.__medivyxEvents ??= []);

const EventSchema = z.object({
  event: z.enum([
    "page_view",
    "product_view",
    "article_view",
    "whatsapp_click",
    "call_click",
    "directions_click",
    "prescription_request",
    "booking_submit",
    "contact_submit",
    "search",
    "search_open",
    "compare_open",
    "chat_message",
    "navigation",
    "share_click",
    "language_toggle",
    "newsletter_signup",
  ]),
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  ts: z.number().default(() => Date.now()),
  path: z.string().max(200).default(""),
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rl = rateLimit(`track:${ip}`, 120, 60_000);
    if (!rl.ok) {
      return new NextResponse(null, { status: 202 });
    }
    const json = await request.json().catch(() => null);
    const parsed = EventSchema.safeParse(json);
    if (!parsed.success) return new NextResponse(null, { status: 202 });
    if (events.length < 5000) {
      events.push({ ...parsed.data, ts: parsed.data.ts || Date.now() });
    }
    return new NextResponse(null, { status: 202 });
  } catch {
    return new NextResponse(null, { status: 202 });
  }
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET() {
  // Aggregated stats are staff-only (demo passcode gate — see /api/admin-login).
  // Event ingestion (POST) stays public and anonymous.
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = (name: string) => events.filter((e) => e.event === name).length;

  // last 7 days buckets (oldest → newest, ending today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekly: { label: string; views: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = today.getTime() - i * 86_400_000;
    const end = start + 86_400_000;
    weekly.push({
      label: DAYS[new Date(start).getDay()],
      views: events.filter(
        (e) => e.event === "page_view" && e.ts >= start && e.ts < end
      ).length,
    });
  }

  const productCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event === "product_view" && typeof e.data.product === "string") {
      productCounts.set(e.data.product, (productCounts.get(e.data.product) ?? 0) + 1);
    }
  }
  const topProducts = [...productCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, views]) => ({ product, views }));

  // Language-toggle breakdown (research round 20): how many switches to
  // Kiswahili vs English, so the owner can gauge Swahili demand.
  const languageBreakdown = { sw: 0, en: 0 };
  for (const e of events) {
    if (e.event === "language_toggle" && (e.data.lang === "sw" || e.data.lang === "en")) {
      languageBreakdown[e.data.lang] += 1;
    }
  }

  return NextResponse.json(
    {
      events: Object.fromEntries(
        [...new Set(events.map((e) => e.event))].map((k) => [
          k,
          events.filter((e) => e.event === k).length,
        ])
      ),
      totals: {
        pageViews: count("page_view"),
        whatsappClicks: count("whatsapp_click"),
        callClicks: count("call_click"),
        requests: count("prescription_request"),
        bookings: count("booking_submit"),
        searches: count("search"),
        chats: count("chat_message"),
        productViews: count("product_view"),
        articleViews: count("article_view"),
        directions: count("directions_click"),
        contacts: count("contact_submit"),
        newsletter: count("newsletter_signup"),
        languageToggles: count("language_toggle"),
      },
      languageBreakdown,
      weekly,
      topProducts,
      since: events.length > 0 ? new Date(events[0].ts).toISOString() : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
