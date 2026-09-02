"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Paperclip,
  Phone,
  Printer,
  MessageCircle,
  MapPin,
  Truck,
  UploadCloud,
  X,
  PartyPopper,
  PackageSearch,
  ShieldCheck,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";
import { isValidKenyanPhone, LENGTHS } from "@/lib/validation";
import { cn } from "@/lib/utils";

const STEPS = ["Your Request", "Your Details", "Pickup or Delivery", "Review"] as const;

const MAX_FILE_MB = 5;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];

interface FormState {
  medicine: string;
  notes: string;
  fullName: string;
  phone: string;
  contactMethod: "whatsapp" | "call";
  fulfilment: "pickup" | "delivery";
}

const INITIAL: FormState = {
  medicine: "",
  notes: "",
  fullName: "",
  phone: "",
  contactMethod: "whatsapp",
  fulfilment: "pickup",
};

/** Draft persistence — a refresh mid-wizard used to lose everything.
 * Text fields (never the prescription file) are saved to localStorage
 * after every change and restored on the next visit. */
const DRAFT_KEY = "medivxy:request-draft";

function loadDraft(): FormState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormState>;
    const merged = { ...INITIAL, ...parsed };
    const meaningful =
      merged.medicine.trim() ||
      merged.fullName.trim() ||
      merged.phone.trim() ||
      merged.notes.trim();
    return meaningful ? merged : null;
  } catch {
    return null;
  }
}

function saveDraft(form: FormState): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch {
    // storage unavailable — drafts simply aren't kept
  }
}

function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/** Which wizard step holds each field (used to jump back to the right
 * place when the server rejects a specific field). */
const FIELD_STEP: Record<string, number> = {
  medicine: 0,
  notes: 0,
  prescription: 0,
  fullName: 1,
  phone: 1,
  contactMethod: 1,
  fulfilment: 2,
};

/**
 * Medicine request workflow (research.md §8):
 * Request → upload prescription → details → pickup/delivery → submit →
 * "Medivyx will review your request" → WhatsApp / Call.
 */
export function RequestMedicineForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore a saved draft once after mount (localStorage is client-only).
  // Indirect setState (open-status pattern) — runs once after mount.
  useEffect(() => {
    const restore = () => {
      const draft = loadDraft();
      if (draft) {
        setForm(draft);
        setDraftRestored(true);
      }
    };
    restore();
  }, []);

  // Persist a draft whenever the text fields change (skips the pristine state).
  useEffect(() => {
    if (reference) return; // success — draft already cleared
    const meaningful =
      form.medicine.trim() || form.fullName.trim() || form.phone.trim() || form.notes.trim();
    if (meaningful) saveDraft(form);
  }, [form, reference]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function validateStep(current: number, field?: string): boolean {
    // When a single field is passed (onBlur), only re-check that field and
    // merge the result into existing errors instead of resetting the batch.
    const next: Record<string, string> = {};
    if (current === 0) {
      if (form.medicine.trim().length < LENGTHS.medicine.min)
        next.medicine = "Please tell us the medicine or product you need.";
    }
    if (current === 1) {
      if (form.fullName.trim().length < LENGTHS.fullName.min)
        next.fullName = "Please enter your full name.";
      if (!isValidKenyanPhone(form.phone))
        next.phone = "Please enter a valid Kenyan phone number, e.g. 07XX XXX XXX.";
    }
    if (field) {
      const message = next[field] ?? "";
      setErrors((e) => {
        const merged = { ...e };
        if (message) merged[field] = message;
        else delete merged[field];
        return merged;
      });
      return !message;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const f = e.target.files?.[0];
    if (!f) return setFile(null);
    if (!ACCEPTED.includes(f.type)) {
      setFileError("Only PDF, JPG, PNG or WebP files are accepted.");
      return setFile(null);
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File must be smaller than ${MAX_FILE_MB}MB.`);
      return setFile(null);
    }
    setFile(f);
  }

  function next() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateStep(0) || !validateStep(1)) {
      // Jump to whichever step holds the first error so the user sees it.
      const merged: Record<string, string> = {};
      if (form.medicine.trim().length < LENGTHS.medicine.min)
        merged.medicine = "Please tell us the medicine or product you need.";
      if (form.fullName.trim().length < LENGTHS.fullName.min)
        merged.fullName = "Please enter your full name.";
      if (!isValidKenyanPhone(form.phone))
        merged.phone = "Please enter a valid Kenyan phone number, e.g. 07XX XXX XXX.";
      setErrors(merged);
      const firstBad = Object.keys(merged)[0];
      const target = firstBad ? FIELD_STEP[firstBad] : 0;
      setStep(target ?? 0);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("medicine", form.medicine);
      fd.set("notes", form.notes);
      fd.set("fullName", form.fullName);
      fd.set("phone", form.phone);
      fd.set("contactMethod", form.contactMethod);
      fd.set("fulfilment", form.fulfilment);
      fd.set("website", ""); // honeypot (spam defense, mirrors the contact form)
      if (file) fd.set("prescription", file);

      const res = await fetch("/api/request-medicine", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok?: boolean;
        reference?: string;
        error?: string;
        fields?: Record<string, string>;
        retryAfter?: number;
      };
      if (!res.ok || !data.ok) {
        // Map per-field server errors onto the form (and jump to the step
        // that owns the first bad field) — previously these were dropped.
        if (data.fields && Object.keys(data.fields).length > 0) {
          setErrors(data.fields);
          const firstBad = Object.keys(data.fields)[0];
          const target = firstBad ? FIELD_STEP[firstBad] : undefined;
          setStep(target !== undefined && target <= 3 ? target : 3);
          toast.error("Please check the highlighted fields.");
        } else {
          setErrors({ submit: data.error ?? "Request failed — please try again." });
          toast.error(data.error ?? "Request failed — please try again.", {
            description: "You can also message us on WhatsApp and we'll help directly.",
          });
        }
        return;
      }
      track("prescription_request", { fulfilment: form.fulfilment, hasFile: !!file });
      setReference(data.reference ?? "MDX-0000");
      clearDraft();
      setStep(4); // success
      toast.success("Request received", {
        description: `Your reference is ${data.reference ?? "MDX-0000"} — keep it safe, you can track your request with it.`,
      });
    } catch {
      setErrors({ submit: "Something went wrong sending your request. Please try again or message us on WhatsApp." });
      toast.error("Network error", {
        description: "We couldn't reach the server. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------- Success state ---------------- */
  if (step === 4) {
    return (
      <Reveal>
        <div className="mx-auto max-w-xl rounded-3xl border bg-card p-8 text-center shadow-lg sm:p-10">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper aria-hidden="true" className="size-8" />
          </span>
          <h2 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">
            Request received
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our pharmacy team will review your request and contact you shortly.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
            <FileText aria-hidden="true" className="size-4" />
            Reference: {reference}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="rounded-full px-7">
              <a
                href={whatsappLink(whatsappMessages.request(reference))}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { source: "request-success" })}
              >
                <MessageCircle aria-hidden="true" className="size-4.5" />
                Chat on WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <a href={business.phoneHref} onClick={() => track("call_click", { source: "request-success" })}>
                <Phone aria-hidden="true" className="size-4.5" />
                Call Medivyx
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-7 no-print"
              onClick={() => window.print()}
            >
              <Printer aria-hidden="true" className="size-4.5" />
              Print reference
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Demo note — no real prescriptions are stored by this website.
          </p>
          <div className="mt-4 border-t pt-4">
            <SiteLink
              href={`/track?ref=${reference}`}
              trackLabel="request-success-track"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline"
            >
              <PackageSearch aria-hidden="true" className="size-4" />
              Track this request
            </SiteLink>
          </div>
        </div>
      </Reveal>
    );
  }

  /* ---------------- Wizard ---------------- */
  return (
    <Reveal>
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-2xl rounded-3xl border bg-card p-6 shadow-lg sm:p-8"
        noValidate
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

        {draftRestored && step < 4 && (
          <div
            role="status"
            className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mint/60 px-4 py-3 text-sm text-mint-foreground"
          >
            <p className="min-w-0 flex-1">
              We restored the details you started earlier — continue where
              you left off.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full px-3 text-xs"
              onClick={() => {
                setForm(INITIAL);
                setErrors({});
                setDraftRestored(false);
                setStep(0);
                clearDraft();
              }}
            >
              <RotateCcw aria-hidden="true" className="size-3.5" />
              Start over
            </Button>
          </div>
        )}

        {/* Progress */}
        <ol className="mb-8 flex items-center gap-2" aria-label="Form progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary/15 text-primary ring-2 ring-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check aria-hidden="true" className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  i === step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              )}
            </li>
          ))}
        </ol>
        {/* Compact step label — mobile users saw dots only before */}
        <p className="-mt-5 mb-7 text-sm font-semibold text-primary sm:hidden">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
        <p className="sr-only" aria-live="polite">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>

        {/* Step 1 — request */}
        {step === 0 && (
          <fieldset className="space-y-5">
            <legend className="font-display text-xl font-semibold">
              What do you need?
            </legend>
            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="medicine">Medicine or product requested</Label>
                <CharCount value={form.medicine.length} max={LENGTHS.medicine.max} />
              </div>
              <Textarea
                id="medicine"
                value={form.medicine}
                onChange={(e) => set("medicine", e.target.value)}
                onBlur={() => validateStep(0, "medicine")}
                placeholder="e.g. Paracetamol 500mg, ORS sachets, my monthly prescription refill…"
                rows={3}
                maxLength={LENGTHS.medicine.max}
                className="mt-2 bg-background"
                aria-invalid={!!errors.medicine}
                aria-describedby={errors.medicine ? "medicine-error" : undefined}
              />
              {errors.medicine && (
                <p id="medicine-error" role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.medicine}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="prescription-upload">
                Prescription <span className="font-normal text-muted-foreground">(optional — photo or PDF)</span>
              </Label>
              <input
                ref={fileInputRef}
                id="prescription-upload"
                name="prescription"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={onFileChange}
                className="sr-only"
              />
              {file ? (
                <div className="mt-2 flex items-center gap-3 rounded-xl border bg-mint/40 p-4">
                  <FileText aria-hidden="true" className="size-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove selected file"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/60 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-mint/30"
                >
                  <UploadCloud aria-hidden="true" className="size-8 text-primary/70" />
                  <span className="text-sm font-medium text-foreground">
                    Upload prescription
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF, JPG, PNG or WebP · up to {MAX_FILE_MB}MB
                  </span>
                </button>
              )}
              {fileError && (
                <p role="alert" className="mt-1.5 text-sm text-destructive">
                  {fileError}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <Label htmlFor="notes">
                  Notes{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <CharCount value={form.notes.length} max={LENGTHS.notes.max} />
              </div>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Anything the pharmacist should know — quantity, brand preference, collection timing…"
                rows={2}
                maxLength={LENGTHS.notes.max}
                className="mt-2 bg-background"
              />
            </div>
          </fieldset>
        )}

        {/* Step 2 — details */}
        {step === 1 && (
          <fieldset className="space-y-5">
            <legend className="font-display text-xl font-semibold">
              Your details
            </legend>
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                onBlur={() => validateStep(1, "fullName")}
                placeholder="e.g. Amina Wanjiru"
                autoComplete="name"
                maxLength={LENGTHS.fullName.max}
                className="mt-2 bg-background"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? "fullName-error" : undefined}
              />
              {errors.fullName && (
                <p id="fullName-error" role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.fullName}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                onBlur={() => validateStep(1, "phone")}
                placeholder="07XX XXX XXX"
                autoComplete="tel"
                maxLength={16}
                className="mt-2 bg-background"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
              />
              {errors.phone ? (
                <p id="phone-error" role="alert" className="mt-1.5 text-sm text-destructive">
                  {errors.phone}
                </p>
              ) : (
                <p id="phone-hint" className="mt-1.5 text-xs text-muted-foreground">
                  Kenyan number — we&apos;ll only use it about this request.
                </p>
              )}
            </div>
            <div>
              <Label>Preferred contact method</Label>
              <RadioGroup
                value={form.contactMethod}
                onValueChange={(v) => set("contactMethod", v as FormState["contactMethod"])}
                className="mt-2 grid gap-3 sm:grid-cols-2"
              >
                <Label
                  htmlFor="contact-whatsapp"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-mint/40"
                >
                  <RadioGroupItem id="contact-whatsapp" value="whatsapp" />
                  <MessageCircle aria-hidden="true" className="size-5 text-primary" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </Label>
                <Label
                  htmlFor="contact-call"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-mint/40"
                >
                  <RadioGroupItem id="contact-call" value="call" />
                  <Phone aria-hidden="true" className="size-5 text-primary" />
                  <span className="text-sm font-medium">Phone call</span>
                </Label>
              </RadioGroup>
            </div>
          </fieldset>
        )}

        {/* Step 3 — fulfilment */}
        {step === 2 && (
          <fieldset className="space-y-5">
            <legend className="font-display text-xl font-semibold">
              Pickup or delivery?
            </legend>
            <RadioGroup
              value={form.fulfilment}
              onValueChange={(v) => set("fulfilment", v as FormState["fulfilment"])}
              className="grid gap-3 sm:grid-cols-2"
            >
              <Label
                htmlFor="fulfilment-pickup"
                className="flex cursor-pointer flex-col gap-3 rounded-xl border p-5 transition-colors has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-mint/40"
              >
                <span className="flex items-center gap-3">
                  <RadioGroupItem id="fulfilment-pickup" value="pickup" />
                  <MapPin aria-hidden="true" className="size-5 text-primary" />
                  <span className="font-semibold">Pickup</span>
                </span>
                <span className="pl-8 text-sm text-muted-foreground">
                  Collect at the pharmacy in {business.area} — ready after the
                  team confirms.
                </span>
              </Label>
              <Label
                htmlFor="fulfilment-delivery"
                className="flex cursor-pointer flex-col gap-3 rounded-xl border p-5 transition-colors has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-mint/40"
              >
                <span className="flex items-center gap-3">
                  <RadioGroupItem id="fulfilment-delivery" value="delivery" />
                  <Truck aria-hidden="true" className="size-5 text-primary" />
                  <span className="font-semibold">Delivery</span>
                </span>
                <span className="pl-8 text-sm text-muted-foreground">
                  Where available — coverage is being confirmed, so the team
                  will confirm options with you.
                </span>
              </Label>
            </RadioGroup>
          </fieldset>
        )}

        {/* Step 4 — review */}
        {step === 3 && (
          <fieldset className="space-y-5">
            <legend className="font-display text-xl font-semibold">
              Review your request
            </legend>
            <dl className="space-y-4 rounded-2xl bg-background/70 p-5 text-sm ring-1 ring-border/70">
              <ReviewRow label="Medicine / product">
                {form.medicine}
                {file && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-xs font-medium text-mint-foreground">
                    <Paperclip aria-hidden="true" className="size-3" />
                    {file.name}
                  </span>
                )}
              </ReviewRow>
              {form.notes && <ReviewRow label="Notes">{form.notes}</ReviewRow>}
              <ReviewRow label="Name">{form.fullName}</ReviewRow>
              <ReviewRow label="Phone">{form.phone}</ReviewRow>
              <ReviewRow label="Contact via">
                {form.contactMethod === "whatsapp" ? "WhatsApp" : "Phone call"}
              </ReviewRow>
              <ReviewRow label="Fulfilment">
                {form.fulfilment === "pickup" ? "Pickup at the pharmacy" : "Delivery (to be confirmed)"}
              </ReviewRow>
            </dl>
            {errors.submit && (
              <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                {errors.submit}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              By submitting you agree that the Medivyx team may contact you
              about this request. Demo note: uploaded prescriptions are not
              stored.
            </p>
          </fieldset>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-full"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="button" onClick={next} className="rounded-full px-6">
              Continue
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="rounded-full px-6">
              {submitting ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Submit Request
                  <Check aria-hidden="true" className="size-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Reveal>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-foreground">{children}</dd>
    </div>
  );
}

/** Subtle character counter — appears once the field nears its limit. */
function CharCount({ value, max }: { value: number; max: number }) {
  const remaining = max - value;
  if (remaining > Math.max(40, max * 0.15)) return null;
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
