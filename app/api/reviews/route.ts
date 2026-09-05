import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getProduct } from "@/lib/data";
import {
  addReview,
  listReviews,
  getReviewSummaries,
  reviewSummaryFor,
} from "@/lib/reviews";

export const runtime = "nodejs";

/**
 * Product reviews endpoint.
 *
 * GET  ?slug=<slug>    → reviews for one product (newest first)
 * GET  ?summary=1      → { avg, count } per product slug (catalogue chips)
 * POST { slug, name, rating, comment } → append a review (validated, rate-limited)
 */

const reviewSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().trim().min(2).max(60),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(4).max(500),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const summary = url.searchParams.get("summary");

  try {
    if (summary === "1") {
      const summaries = await getReviewSummaries();
      return NextResponse.json(
        { ok: true, summaries },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    if (slug) {
      if (!getProduct(slug)) {
        return NextResponse.json(
          { error: "Unknown product." },
          { status: 404 }
        );
      }
      const reviews = await listReviews(slug);
      const summaryFor = await reviewSummaryFor(slug);
      return NextResponse.json(
        { ok: true, reviews, summary: summaryFor },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "Provide ?slug= or ?summary=1." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Couldn't load reviews right now." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rl = rateLimit(`review:${ip}`, 3, 60_000);
    if (!rl.ok) {
      return rateLimitResponse(
        rl.retryAfterSec,
        "Too many reviews submitted — please wait a moment."
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          fields: {
            form:
              "Please add your name, a rating between 1 and 5, and a short comment.",
          },
        },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (!getProduct(data.slug)) {
      return NextResponse.json(
        { error: "Unknown product." },
        { status: 404 }
      );
    }

    const review = await addReview(data);
    if (!review) {
      return NextResponse.json(
        {
          error:
            "This product already has the maximum number of demo reviews — asante for sharing!",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      ok: true,
      review,
      summary: await reviewSummaryFor(data.slug),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't save your review right now." },
      { status: 500 }
    );
  }
}
