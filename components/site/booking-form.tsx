"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarCheck,
  Clock,
  FileText,
  HeartPulse,
  Leaf,
  Loader2,
  MessageCircle,
  PackageSearch,
  PartyPopper,
  Phone,
  Pill,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import {
  CONSULT_TYPES,
  slotsForDate,
  slotLabel,
  slotPeriod,
  type ConsultType,
} from "@/lib/booking-shared";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";
import { LENGTHS } from "@/lib/validation";
import { cn } from "@/lib/utils";

const CONSULT_ICONS: Record<string, typeof Pill> = {
  "pharmacist-chat": MessageCircle,
  "prescription-review": FileText,
  "bp-check": HeartPulse,
  "wellness-advice": Leaf,
};

/** Imagery per consultation type — self-explanatory at a glance. */
const CONSULT_IMAGES: Record<string, string> = {
  "pharmacist-chat": "/images/service-consult.webp",
  "prescription-review": "/images/quick-rx.webp",
  "bp-check": "/images/products/blood-pressure-monitor.webp",
  "wellness-advice": "/images/category-wellness.webp",
};

const DAYS_AHEAD = 13; // 14 bookable days including today

/** Subtle notes counter — appears once the field nears its limit. */
function NotesCount({ value, max }: { value: number; max: number }) {
  const remaining = max - value;
  if (remaining > 80) return null;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        remaining <= 20 ? "font-semibold text-destructive" : "text-muted-foreground"
      )}
      aria-hidden="true"
    >
      {remaining} left
    </span>
  );
}

interface DayOption {
  iso: string; // yyyy-mm-dd
  date: Date;
  weekday: string;
  dayNum: number;
  month: string;
  isToday: boolean;
}

interface FormState {
  consultType: string;
  date: string; // iso
  slot: string; // "HH:MM"
  fullName: string;
  phone: string;
  notes: string;
}

/**
 * Pharmacist consultation booking form.
 * Consult type → day → time slot → details → reference confirmation.
 * Day/slot chips are derived from `business.hours` (single source of truth):
 * every open day is bookable, slots stop an hour before closing.
 */
export function BookingForm() {
  const [days, setDays] = useState<DayOption[]>([]);
  const [nowMs, setNowMs] = useState(0);
  const [form, setForm] = useState<FormState>({
    consultType: "",
    date: "",
    slot: "",
    fullName: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [summary, setSummary] = useState("");

  // Build the day strip AFTER mount — dates differ per render environment,
  // and SSR/CSR must agree to avoid hydration mismatch.
  useEffect(() => {
    const list: DayOption[] = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 0; i <= DAYS_AHEAD; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      list.push({
        iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        date: d,
        weekday: d.toLocaleDateString("en-KE", { weekday: "short" }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("en-KE", { month: "short" }),
        isToday: i === 0,
      });
    }
    // Indirect setState (open-status pattern) — runs once after mount.
    const init = () => {
      setDays(list);
      setNowMs(Date.now());
      setForm((f) => (f.date ? f : { ...f, date: list[0]?.iso ?? "" }));
    };
    init();
  }, []);

  // Keep "past slot" disabling fresh: previously `nowMs` was frozen at
  // mount, so a page left open overnight kept showing bookable past times.
  // (Same 60s cadence as useOpenStatus.)
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const selectedDay = useMemo(
    () => days.find((d) => d.iso === form.date) ?? null,
    [days, form.date]
  );

  const slots = useMemo(() => {
    if (!selectedDay || !nowMs) return [] as { slot: string; disabled: boolean }[];
    return slotsForDate(selectedDay.date).map((slot) => {
      const [h] = slot.split(":").map(Number);
      const dt = new Date(selectedDay.date);
      dt.setHours(h, 0, 0, 0);
      return { slot, disabled: dt.getTime() <= nowMs };
    });
  }, [selectedDay, nowMs]);

  // Derived: a kept slot must still exist on the chosen day — switching days
  // with a stale slot simply reads as unselected (no reset effect needed).
  const effectiveSlot = slots.some((s) => s.slot === form.slot && !s.disabled)
    ? form.slot
    : "";

  const groupedSlots = useMemo(() => {
    const periods = ["Morning", "Afternoon", "Evening"] as const;
    return periods
      .map((p) => ({ period: p, items: slots.filter((s) => slotPeriod(s.slot) === p) }))
      .filter((g) => g.items.length > 0);
  }, [slots]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.consultType) next.consultType = "Please choose a consultation type.";
    if (!form.date) next.date = "Please choose a day.";
    if (!effectiveSlot) next.slot = "Please choose a time slot.";
    if (form.fullName.trim().length < 2) next.fullName = "Please enter your full name.";
    if (!/^(?:\+?254|0)\d{9}$/.test(form.phone.replace(/\s+/g, "")))
      next.phone = "Please enter a valid Kenyan phone number, e.g. 07XX XXX XXX.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please complete the highlighted choices.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultType: form.consultType,
          date: form.date,
          slot: effectiveSlot,
          fullName: form.fullName,
          phone: form.phone,
          notes: form.notes,
          website: "", // honeypot (spam defense, mirrors the contact form)
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        summary?: string;
        error?: string;
        fields?: Record<string, string>;
      };
      if (!res.ok || !data.ok) {
        if (data.fields) setErrors(data.fields);
        else setErrors({ submit: data.error ?? "Booking failed — please try again." });
        toast.error(data.error ?? "Booking failed — please try again.");
        return;
      }
      track("booking_submit", { consultType: form.consultType });
      setReference(data.reference ?? "BKG-0000");
      setSummary(data.summary ?? "");
      toast.success("Booking received", {
        description: `${data.reference ?? "BKG-0000"} · ${data.summary ?? ""} — the team will confirm by phone or WhatsApp.`,
      });
    } catch {
      setErrors({ submit: "Network error — please try again or message us on WhatsApp." });
      toast.error("Network error", {
        description: "We couldn't reach the server. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------- Success state ---------------- */
  if (reference) {
    return (
      <Reveal>
        <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 text-center shadow-lg sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper aria-hidden="true" className="size-8" />
          </span>
          <h2 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">
            Booking received
          </h2>
          <p className="mt-3 text-muted-foreground">
            The pharmacy team will confirm your slot by phone or WhatsApp.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
            <CalendarCheck aria-hidden="true" className="size-4" />
            {reference} · {summary}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="rounded-full px-7">
              <a
                href={whatsappLink(
                  whatsappMessages.booking(reference, summary.toLowerCase())
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { source: "booking-success" })}
              >
                <MessageCircle aria-hidden="true" className="size-4.5" />
                Confirm on WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <a
                href={business.phoneHref}
                onClick={() => track("call_click", { source: "booking-success" })}
              >
                <Phone aria-hidden="true" className="size-4.5" />
                Call Medivyx
              </a>
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Demo note — no real appointments are booked by this website.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t pt-4">
            <SiteLink
              href={`/track?ref=${reference}`}
              trackLabel="booking-success-track"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              <PackageSearch aria-hidden="true" className="size-4" />
              Track this booking
            </SiteLink>
            <button
              type="button"
              onClick={() => {
                setReference("");
                setForm({ consultType: "", date: days[0]?.iso ?? "", slot: "", fullName: "", phone: "", notes: "" });
                setErrors({});
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              <CalendarCheck aria-hidden="true" className="size-4" />
              Book another consultation
            </button>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
            <span aria-hidden="true" className="live-dot" />
            The tracking page refreshes your booking status automatically —
            keep your reference safe.
          </p>
        </div>
      </Reveal>
    );
  }

  /* ---------------- Form ---------------- */
  return (
    <Reveal className="min-w-0">
      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8"
      >
        {/* Honeypot (spam protection — hidden from humans and assistive tech) */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {/* 1 — Consultation type */}
        <fieldset className="min-w-0">
          <legend className="font-display text-xl font-semibold">
            What do you need help with?
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {CONSULT_TYPES.map((c: ConsultType, ci: number) => {
              const Icon = CONSULT_ICONS[c.id] ?? Pill;
              const selected = form.consultType === c.id;
              const image = CONSULT_IMAGES[c.id] ?? "/images/quick-book.webp";
              return (
                <label
                  key={c.id}
                  className={cn(
                    "group relative flex cursor-pointer gap-3 overflow-hidden rounded-xl border p-0 transition-all duration-200 has-[input:checked]:border-primary has-[input:checked]:shadow-md",
                    "hover:border-primary/50 hover:shadow-sm"
                  )}
                >
                  <input
                    type="radio"
                    name="consult-type"
                    value={c.id}
                    checked={selected}
                    onChange={() => set("consultType", c.id)}
                    className="peer sr-only"
                  />
                  {/* Thumbnail */}
                  <span className="relative hidden w-24 shrink-0 overflow-hidden sm:block">
                    <Image
                      src={image}
                      alt=""
                      fill
                      priority={ci === 0}
                      sizes="96px"
                      className={cn(
                        "object-cover transition-all duration-300",
                        selected
                          ? "opacity-100"
                          : "opacity-75 grayscale-[30%] group-hover:opacity-100 group-hover:grayscale-0"
                      )}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:pl-4">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          <Icon aria-hidden="true" className="size-4.5" />
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {c.label}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[0.625rem] font-medium text-secondary-foreground">
                        <Clock aria-hidden="true" className="size-3" />
                        {c.duration}
                      </span>
                    </span>
                    <span className="text-xs leading-5 text-muted-foreground">
                      {c.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {errors.consultType && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {errors.consultType}
            </p>
          )}
        </fieldset>

        {/* 2 — Day */}
        <fieldset className="mt-8 min-w-0">
          <legend className="font-display text-xl font-semibold">
            Pick a day
          </legend>
          <p className="mt-1 text-xs text-muted-foreground">
            Next 14 days · slots follow the pharmacy&apos;s opening hours
          </p>
          <div
            className="scrollbar-thin mt-4 flex gap-2 overflow-x-auto pb-2"
            role="radiogroup"
            aria-label="Choose a day"
          >
            {days.length === 0
              ? Array.from({ length: 14 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden="true"
                    className="h-[4.4rem] w-16 shrink-0 animate-pulse rounded-xl bg-muted"
                  />
                ))
              : days.map((d) => {
                  const selected = form.date === d.iso;
                  return (
                    <label
                      key={d.iso}
                      className={cn(
                        "relative flex h-[4.4rem] w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border transition-all duration-200",
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "bg-background hover:border-primary/50 hover:bg-mint/30"
                      )}
                    >
                      <input
                        type="radio"
                        name="booking-day"
                        value={d.iso}
                        checked={selected}
                        onChange={() => {
                          set("date", d.iso);
                          set("slot", "");
                        }}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "text-[0.625rem] font-semibold uppercase tracking-wide",
                          selected ? "text-primary-foreground/75" : "text-muted-foreground"
                        )}
                      >
                        {d.isToday ? "Today" : d.weekday}
                      </span>
                      <span className="font-display text-lg font-semibold leading-none">
                        {d.dayNum}
                      </span>
                      <span
                        className={cn(
                          "text-[0.625rem]",
                          selected ? "text-primary-foreground/75" : "text-muted-foreground"
                        )}
                      >
                        {d.month}
                      </span>
                    </label>
                  );
                })}
          </div>
          {errors.date && (
            <p role="alert" className="mt-1 text-sm text-destructive">
              {errors.date}
            </p>
          )}
        </fieldset>

        {/* 3 — Time slot */}
        <fieldset className="mt-8 min-w-0">
          <legend className="font-display text-xl font-semibold">
            Choose a time
          </legend>
          {selectedDay ? (
            groupedSlots.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                No remaining slots on this day — please pick another.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {groupedSlots.map(({ period, items }) => (
                  <div key={period}>
                    <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                      {period === "Morning" && (
                        <Sunrise aria-hidden="true" className="size-3.5" />
                      )}
                      {period === "Afternoon" && (
                        <Sun aria-hidden="true" className="size-3.5" />
                      )}
                      {period === "Evening" && (
                        <Sunset aria-hidden="true" className="size-3.5" />
                      )}
                      {period}
                    </p>
                    <div
                      className="mt-2 flex flex-wrap gap-2"
                      role="radiogroup"
                      aria-label={`${period} time slots`}
                    >
                      {items.map(({ slot, disabled }) => {
                        const selected = effectiveSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={disabled}
                            onClick={() => set("slot", slot)}
                            className={cn(
                              "min-h-11 min-w-24 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.96]",
                              selected
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : disabled
                                  ? "cursor-not-allowed border-border/60 bg-muted/40 text-muted-foreground/50 line-through"
                                  : "bg-background text-foreground/85 hover:border-primary/50 hover:bg-mint/30"
                            )}
                          >
                            {slotLabel(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Loading times…</p>
          )}
          {errors.slot && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {errors.slot}
            </p>
          )}
        </fieldset>

        {/* 4 — Details */}
        <fieldset className="mt-8">
          <legend className="font-display text-xl font-semibold">
            Your details
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="booking-name">Full name</Label>
              <Input
                id="booking-name"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                placeholder="e.g. Amina Wanjiru"
                autoComplete="name"
                maxLength={LENGTHS.fullName.max}
                className="mt-2 bg-background"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "booking-name-error" : undefined}
              />
              {errors.fullName && (
                <p id="booking-name-error" role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.fullName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="booking-phone">Phone number</Label>
              <Input
                id="booking-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="07XX XXX XXX"
                autoComplete="tel"
                maxLength={16}
                className="mt-2 bg-background"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "booking-phone-error" : "booking-phone-hint"}
              />
              {errors.phone ? (
                <p id="booking-phone-error" role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.phone}
                </p>
              ) : (
                <p id="booking-phone-hint" className="mt-1.5 text-xs text-muted-foreground">
                  Kenyan number — the team confirms your slot on it.
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="booking-notes">
                Notes <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <NotesCount value={form.notes.length} max={LENGTHS.bookingNotes.max} />
            </div>
            <Textarea
              id="booking-notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything the pharmacist should know before the consultation…"
              rows={2}
              maxLength={LENGTHS.bookingNotes.max}
              className="mt-2 bg-background"
            />
          </div>
        </fieldset>

        {/* Summary + submit */}
        <div className="mt-6 rounded-2xl bg-background/70 p-4 text-sm ring-1 ring-border/70">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            <CalendarCheck aria-hidden="true" className="size-4 text-primary" />
            {form.consultType ? (
              <span className="font-medium text-foreground">
                {CONSULT_TYPES.find((c) => c.id === form.consultType)?.label}
              </span>
            ) : (
              "Choose a consultation type"
            )}
            {selectedDay && (
              <span>
                ·{" "}
                {selectedDay.isToday
                  ? "Today"
                  : `${selectedDay.weekday} ${selectedDay.dayNum} ${selectedDay.month}`}
              </span>
            )}
            {effectiveSlot && <span>· {slotLabel(effectiveSlot)}</span>}
          </p>
        </div>

        {errors.submit && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
          >
            {errors.submit}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            The team confirms every booking — no payment needed. More than one
            person can hold a slot; the pharmacist manages the queue.
          </p>
          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="rounded-full px-6 active:scale-[0.98]"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                Booking…
              </>
            ) : (
              <>
                Book Consultation
                <ArrowRight aria-hidden="true" className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Reveal>
  );
}
