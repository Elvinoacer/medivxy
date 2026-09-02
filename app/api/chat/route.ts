import { NextResponse } from "next/server";
import { z } from "zod";
import { getBotReply, type ChatHistoryTurn } from "@/lib/chatbot";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { maybeTrackReply } from "@/lib/request-status";

export const runtime = "nodejs";

const HistorySchema = z.object({
  role: z.enum(["user", "bot"]),
  content: z.string().max(2000),
  suggestions: z.array(z.string().max(200)).max(8).optional(),
});

const BodySchema = z.object({
  message: z.string().trim().min(1).max(400),
  history: z.array(HistorySchema).max(12).optional(),
});

/**
 * "Ask Medivyx" chatbot endpoint (research.md §27–28).
 *
 * Runs the self-contained knowledge-base engine — deterministic, no API
 * keys required. To upgrade: replace `getBotReply` with an LLM call that
 * receives the same knowledge base as its system prompt, with identical
 * safety guardrails (never diagnose, prescribe or guarantee stock).
 */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

    const rl = rateLimit(`chat:${ip}`, 20, 60_000);
    if (!rl.ok) {
      return rateLimitResponse(rl.retryAfterSec, "Too many messages.");
    }

    const json = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please send a valid message (1–400 characters)." },
        { status: 400 }
      );
    }

    // Conversation context (last turns) lets the engine resolve follow-ups
    // like "yes" or "how much is it?" instead of falling back to "not sure".
    const history: ChatHistoryTurn[] = (parsed.data.history ?? [])
      .slice(-8)
      .map((h) => ({ role: h.role, content: h.content, suggestions: h.suggestions }));

    const reply = getBotReply(parsed.data.message, history);

    // Reference codes (MDX-XXXX) get a deterministic, data-grounded answer
    // from the tracking store — but safety replies always win.
    if (reply.intent !== "medical-advice" && reply.intent !== "emergency") {
      const trackReply = await maybeTrackReply(parsed.data.message);
      if (trackReply) return NextResponse.json(trackReply);
    }

    return NextResponse.json(reply);
  } catch {
    return NextResponse.json({ error: "Chat unavailable" }, { status: 500 });
  }
}
