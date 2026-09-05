import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getProduct } from "@/lib/data";
import { addQuestion, listQuestions, questionCounts } from "@/lib/questions";

export const runtime = "nodejs";

const LENGTHS = {
  name: { min: 2, max: 40 },
  question: { min: 10, max: 400 },
};

const payloadSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().max(LENGTHS.name.max).optional().or(z.literal("")),
  question: z.string().min(LENGTHS.question.min).max(LENGTHS.question.max),
});

/**
 * Product Q&A endpoints.
 * GET  ?slug=        → questions for one product (answered first)
 *      ?summary=1    → per-slug answered/pending counts (catalogue chips)
 * POST {slug, name?, question} → new question, pending staff answer.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("summary") === "1") {
    const counts = await questionCounts();
    return NextResponse.json(
      { counts },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  const slug = (url.searchParams.get("slug") ?? "").slice(0, 120);
  if (!slug) {
    return NextResponse.json(
      { error: "Provide a product (?slug=)." },
      { status: 400 }
    );
  }
  const questions = await listQuestions(slug);
  return NextResponse.json(
    { questions },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rl = rateLimit(`question:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return rateLimitResponse(
        rl.retryAfterSec,
        "You've asked a few questions in a minute — the pharmacist answers within a few hours."
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please write a question of 10–400 characters." },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (!getProduct(data.slug)) {
      return NextResponse.json(
        { error: "We couldn't find that product." },
        { status: 404 }
      );
    }

    const question = await addQuestion({
      slug: data.slug,
      askedBy: (data.name ?? "").trim() || "Anonymous",
      question: data.question.trim(),
    });
    if (!question) {
      return NextResponse.json(
        {
          error:
            "This product already has many questions pending — please message us on WhatsApp instead.",
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ ok: true, question }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save your question right now." },
      { status: 500 }
    );
  }
}
