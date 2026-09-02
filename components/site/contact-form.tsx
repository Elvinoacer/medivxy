"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, Loader2, MessageCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";
import { isValidKenyanPhone, LENGTHS } from "@/lib/validation";
import { cn } from "@/lib/utils";

const REASONS = [
  "General question",
  "Product availability",
  "Prescription",
  "Refill / repeat request",
  "Feedback",
  "Business enquiry",
] as const;

/** Subtle character counter — appears once the message nears its limit. */
function MessageCount({ value, max }: { value: number; max: number }) {
  const remaining = max - value;
  if (remaining > 300) return null;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        remaining <= 50 ? "font-semibold text-destructive" : "text-muted-foreground"
      )}
      aria-hidden="true"
    >
      {remaining} left
    </span>
  );
}

/** Contact form (research.md §17) — with server-side validation. */
export function ContactForm() {
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    reason: "" as string,
    message: "",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const set = (key: keyof typeof values, value: string) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < LENGTHS.fullName.min)
      next.name = "Please enter your name.";
    if (!isValidKenyanPhone(values.phone))
      next.phone = "Please enter a valid phone number.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "Please enter a valid email address.";
    if (values.message.trim().length < LENGTHS.contactMessage.min)
      next.message = `Please write a short message (at least ${LENGTHS.contactMessage.min} characters).`;
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error("Please check the highlighted fields.");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
      };
      if (!res.ok || !data?.ok) {
        // Server-side (zod) field errors map onto the same highlights the
        // client uses — previously the server reply was a generic sentence.
        if (data?.fields && Object.keys(data.fields).length > 0) {
          setErrors(data.fields);
          toast.error("Please check the highlighted fields.");
        } else {
          setErrors({ submit: data?.error ?? "Message failed to send. Please try again." });
          toast.error(data?.error ?? "Message failed to send. Please try again.");
        }
        setStatus("idle");
        return;
      }
      track("contact_submit", { reason: values.reason });
      setStatus("sent");
      toast.success("Message sent", {
        description: "The Medivyx team will get back to you during opening hours.",
      });
    } catch {
      setStatus("idle");
      setErrors({ submit: "Network error — please try again or reach us on WhatsApp." });
      toast.error("Network error", {
        description: "We couldn't reach the server. Please check your connection and try again.",
      });
    }
  }

  if (status === "sent") {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border bg-card p-8 text-center shadow-lg sm:p-10">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check aria-hidden="true" className="size-7" />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold">
          Message sent
        </h3>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Thank you, {values.name.split(" ")[0]}. The Medivyx team will get
          back to you shortly during opening hours.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline" className="rounded-full">
            <a
              href={whatsappLink(whatsappMessages.general)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "contact-success" })}
            >
              <MessageCircle aria-hidden="true" className="size-4" />
              Message us on WhatsApp instead
            </a>
          </Button>
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => {
              // Same reset pattern as the booking form's "Book another".
              setValues({
                name: "",
                phone: "",
                email: "",
                reason: "",
                message: "",
                website: "",
              });
              setErrors({});
              setStatus("idle");
            }}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl border bg-card p-6 shadow-lg sm:p-8"
    >
      <h3 className="font-display text-xl font-semibold">Send us a message</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        We reply during opening hours — usually the same day.
      </p>

      {/* Honeypot (spam protection, research.md §26) */}
      <input
        type="text"
        name="website"
        value={values.website}
        onChange={(e) => set("website", e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            maxLength={LENGTHS.fullName.max}
            className="mt-2 bg-background"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
          />
          {errors.name && (
            <p id="contact-name-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.name}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            type="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            autoComplete="tel"
            placeholder="07XX XXX XXX"
            maxLength={16}
            className="mt-2 bg-background"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
          />
          {errors.phone && (
            <p id="contact-phone-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.phone}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-email">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="contact-email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            maxLength={120}
            className="mt-2 bg-background"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          {errors.email && (
            <p id="contact-email-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-reason">Reason for contacting us</Label>
          <Select value={values.reason} onValueChange={(v) => set("reason", v)}>
            <SelectTrigger id="contact-reason" className="mt-2 bg-background">
              <SelectValue placeholder="Choose a reason" />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="contact-message">Message</Label>
            <MessageCount value={values.message.length} max={LENGTHS.contactMessage.max} />
          </div>
          <Textarea
            id="contact-message"
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            rows={4}
            placeholder="How can we help?"
            maxLength={LENGTHS.contactMessage.max}
            className="mt-2 bg-background"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
          />
          {errors.message && (
            <p id="contact-message-error" role="alert" className="mt-1.5 text-sm text-destructive">{errors.message}</p>
          )}
        </div>
      </div>

      {errors.submit && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {errors.submit}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={status === "sending"}
        className="mt-6 w-full rounded-full sm:w-auto sm:px-8"
      >
        {status === "sending" ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send Message"
        )}
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Prefer to talk? Call {business.phone} or message us on WhatsApp.
      </p>
    </form>
  );
}
