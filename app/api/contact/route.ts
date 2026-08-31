import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { logSubmission } from "@/lib/submissions";

export const runtime = "nodejs";

const BodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(9).max(20),
  email: z
    .union([z.string().trim().email().max(120), z.literal("")])
    .optional(),
  reason: z.string().trim().max(80).optional(),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional(), // honeypot must stay empty
});

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many messages — please try again shortly." },
        { status: 429 }
      );
    }

    const json = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the highlighted fields and try again." },
        { status: 400 }
      );
    }

    // Honeypot hit → pretend success (do not tip off bots)
    if (parsed.data.website) {
      return NextResponse.json({ ok: true });
    }

    await logSubmission("contact", {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? "",
      reason: parsed.data.reason ?? "",
      message: parsed.data.message,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not send your message right now." },
      { status: 500 }
    );
  }
}
