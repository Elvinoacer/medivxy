import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listBookings } from "@/lib/bookings";
import { consultLabel, slotLabel } from "@/lib/booking-shared";
import { listMedicineRequests } from "@/lib/submissions";
import { listSubscribers } from "@/lib/newsletter";

export const runtime = "nodejs";

/**
 * Staff CSV export (demo passcode gate) — research.md §25 "admin-ready"
 * operations: download the current bookings, medicine-request or newsletter
 * lists as a spreadsheet for offline records / reporting.
 */

const DATASETS = ["bookings", "requests", "newsletter"] as const;
type Dataset = (typeof DATASETS)[number];

function isDataset(value: string | null): value is Dataset {
  return value !== null && (DATASETS as readonly string[]).includes(value);
}

/** Escape one CSV field (RFC 4180 — quote fields with commas/quotes/newlines). */
function csvField(value: unknown): string {
  const v = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (/[",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows]
    .map((row) => row.map(csvField).join(","))
    .join("\r\n");
  // BOM so Excel opens the UTF-8 file with the right encoding.
  return `\uFEFF${lines}\r\n`;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Parse the optional `days` range filter (7 or 30). Returns the cutoff
 * ISO instant, or null for "all time". Anything else is rejected so the
 * URL contract stays explicit.
 */
function parseCutoff(raw: string | null): { cutoff: string | null } {
  if (raw === null || raw === "all") return { cutoff: null };
  if (raw === "7" || raw === "30") {
    return { cutoff: new Date(Date.now() - Number(raw) * 86_400_000).toISOString() };
  }
  throw new Error("bad-days");
}

/** Include a row whose date-ish field is >= the cutoff (null cutoff = all rows). */
function withinCutoff(value: string, cutoff: string | null): boolean {
  if (!cutoff) return true;
  return new Date(value).getTime() >= new Date(cutoff).getTime();
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataset = new URL(request.url).searchParams.get("dataset");
  if (!isDataset(dataset)) {
    return NextResponse.json(
      { error: "Unknown dataset — use bookings, requests or newsletter." },
      { status: 400 }
    );
  }

  let cutoff: string | null;
  try {
    ({ cutoff } = parseCutoff(new URL(request.url).searchParams.get("days")));
  } catch {
    return NextResponse.json(
      { error: "Unknown days filter — use 7, 30 or all." },
      { status: 400 }
    );
  }

  let csv: string;

  if (dataset === "bookings") {
    const bookings = (await listBookings())
      .filter((b) => withinCutoff(b.receivedAt, cutoff));
    csv = toCsv(
      [
        "Reference",
        "Status",
        "Consultation",
        "Date",
        "Slot",
        "Customer",
        "Phone",
        "Notes",
        "Received",
      ],
      bookings.map((b) => [
        b.reference,
        b.status,
        consultLabel(b.consultType),
        b.date,
        slotLabel(b.slot),
        b.fullName,
        b.phone,
        b.notes,
        b.receivedAt,
      ])
    );
  } else if (dataset === "requests") {
    const requests = (await listMedicineRequests())
      .filter((r) => withinCutoff(r.receivedAt, cutoff));
    csv = toCsv(
      [
        "Reference",
        "Status",
        "Medicine",
        "Fulfilment",
        "Customer",
        "Phone",
        "Contact method",
        "Prescription file",
        "Notes",
        "Received",
      ],
      requests.map((r) => [
        r.reference,
        r.status,
        r.medicine,
        r.fulfilment,
        r.fullName,
        r.phone,
        r.contactMethod,
        r.prescriptionFileName,
        r.notes,
        r.receivedAt,
      ])
    );
  } else {
    const subscribers = (await listSubscribers())
      .filter((s) => withinCutoff(s.subscribedAt, cutoff));
    csv = toCsv(
      ["Email", "Source", "Subscribed"],
      subscribers.map((s) => [s.email, s.source, s.subscribedAt])
    );
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="medivyx-${dataset}-${dateStamp()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
