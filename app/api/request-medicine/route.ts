import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { logSubmission, newReference } from "@/lib/submissions";

export const runtime = "nodejs";

const MAX_FILE_MB = 5;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

function field(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Medicine request endpoint (research.md §8 + §26).
 * Validates server-side, restricts file type/size, and — for the demo —
 * does NOT store the uploaded prescription itself, only its metadata.
 */
export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    if (!rateLimit(`request:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests — please try again shortly." },
        { status: 429 }
      );
    }

    const fd = await request.formData().catch(() => null);
    if (!fd) {
      return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    }

    const medicine = field(fd, "medicine");
    const fullName = field(fd, "fullName");
    const phone = field(fd, "phone");
    const notes = field(fd, "notes");
    const contactMethod = field(fd, "contactMethod");
    const fulfilment = field(fd, "fulfilment");

    const errors: Record<string, string> = {};
    if (medicine.length < 3 || medicine.length > 500)
      errors.medicine = "Please describe the medicine or product you need.";
    if (fullName.length < 2 || fullName.length > 80)
      errors.fullName = "Please enter your full name.";
    if (!/^(?:\+?254|0)\d{9}$/.test(phone.replace(/\s+/g, "")))
      errors.phone = "Please enter a valid Kenyan phone number.";
    if (!["whatsapp", "call"].includes(contactMethod))
      errors.contactMethod = "Please choose a contact method.";
    if (!["pickup", "delivery"].includes(fulfilment))
      errors.fulfilment = "Please choose pickup or delivery.";
    if (notes.length > 1000) errors.notes = "Notes are too long.";

    const file = fd.get("prescription");
    let fileName = "";
    if (file instanceof File && file.size > 0) {
      if (!ACCEPTED.includes(file.type)) {
        errors.prescription = "Only PDF, JPG, PNG or WebP files are accepted.";
      } else if (file.size > MAX_FILE_MB * 1024 * 1024) {
        errors.prescription = `File must be smaller than ${MAX_FILE_MB}MB.`;
      } else {
        fileName = `${file.name} (${(file.size / 1024).toFixed(0)}KB)`;
        // Demo: file content intentionally not persisted (research.md §26)
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Validation failed", fields: errors }, { status: 400 });
    }

    const reference = newReference();
    await logSubmission("request", {
      reference,
      medicine,
      fullName,
      phone,
      notes,
      contactMethod,
      fulfilment,
      prescriptionFileName: fileName,
    });

    return NextResponse.json({ ok: true, reference });
  } catch {
    return NextResponse.json(
      { error: "Could not submit your request right now." },
      { status: 500 }
    );
  }
}
