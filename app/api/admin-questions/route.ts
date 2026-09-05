import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  answerQuestion,
  dismissQuestion,
  listAllQuestions,
} from "@/lib/questions";

export const runtime = "nodejs";

const answerSchema = z.object({
  id: z.string().min(1).max(40),
  answer: z.string().min(2).max(1500),
  answeredBy: z.string().max(60).optional().or(z.literal("")),
});

const dismissSchema = z.object({
  id: z.string().min(1).max(40),
  dismiss: z.literal(true),
});

/**
 * Staff-only Q&A management.
 * GET  — all questions (pending first)
 * POST — answer a question (answer shown on the product page) or
 *        dismiss it entirely {id, dismiss: true}.
 */
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const questions = await listAllQuestions();
  return NextResponse.json(
    { questions },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`admin-questions:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec, "Too many updates.");
  }

  const body: unknown = await request.json().catch(() => null);

  const dismiss = dismissSchema.safeParse(body);
  if (dismiss.success) {
    const ok = await dismissQuestion(dismiss.data.id);
    if (!ok) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, dismissed: dismiss.data.id });
  }

  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "An answer needs 2–1500 characters." },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const question = await answerQuestion(
    data.id,
    data.answer.trim(),
    (data.answeredBy ?? "").trim() || "Medivyx team"
  );
  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }
  return NextResponse.json(
    { ok: true, question },
    { headers: { "Cache-Control": "no-store" } }
  );
}
