import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { logSubmission } from "@/lib/submissions";
import { isValidKenyanPhone } from "@/lib/validation";

export const runtime = "nodejs";

const BodySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long."),
  phone: z.string().trim().min(9, "Please enter a valid phone number.").max(20, "Phone number is too long."),
  email: z
    .union([z.string().trim().email("Please enter a valid email address.").max(120), z.literal("")])
    .optional(),
  reason: z.string().trim().max(80).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Please write a short message (at least 10 characters).")
    .max(2000, "Message is too long (max 2000 characters)."),
  website: z.string().max(0).optional(), // honeypot must stay empty
});

/** Map zod issues back to per-field errors so the form can highlight them
 *  exactly like its own client-side validation (same UX in both layers). */
function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && key !== "website" && !fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const rl = rateLimit(`contact:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return rateLimitResponse(rl.retryAfterSec, "Too many messages.");
    }

    const json = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      const fields = zodFieldErrors(parsed.error);
      return NextResponse.json(
        { error: "Please check the highlighted fields and try again.", fields },
        { status: 400 }
      );
    }

    // Extra check: Kenyan format (the zod layer only checks length).
    if (!isValidKenyanPhone(parsed.data.phone)) {
      return NextResponse.json(
        {
          error: "Please check the highlighted fields and try again.",
          fields: { phone: "Please enter a valid Kenyan phone number." },
        },
        { status: 400 }
      );
    }

    // Honeypot hit → pretend success (do not tip off bots)
    if (parsed.data.website) {
      return NextResponse.json({ ok: true });
    }

    const stored = await logSubmission("contact", {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email ?? "",
      reason: parsed.data.reason ?? "",
      message: parsed.data.message,
    });
    if (!stored) {
      // Demo store failure — surface it instead of a silent loss.
      return NextResponse.json(
        {
          error:
            "We couldn't save your message right now. Please try again or reach us on WhatsApp.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not send your message right now." },
      { status: 500 }
    );
  }
}
