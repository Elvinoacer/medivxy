"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";
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

const REASONS = [
  "General question",
  "Product availability",
  "Prescription",
  "Refill / repeat request",
  "Feedback",
  "Business enquiry",
] as const;

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
    if (values.name.trim().length < 2) next.name = "Please enter your name.";
    if (!/^(?:\+?254|0)\d{9}$/.test(values.phone.replace(/\s+/g, "")))
      next.phone = "Please enter a valid phone number.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "Please enter a valid email address.";
    if (values.message.trim().length < 10)
      next.message = "Please write a short message (at least 10 characters).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      track("contact_submit", { reason: values.reason });
      setStatus("sent");
    } catch {
      setStatus("idle");
      setErrors({ submit: "Message failed to send. Please try again or reach us on WhatsApp." });
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
        <Button asChild variant="outline" className="mt-6 rounded-full">
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
            className="mt-2 bg-white"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.name}</p>
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
            className="mt-2 bg-white"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && (
            <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.phone}</p>
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
            className="mt-2 bg-white"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.email}</p>
          )}
        </div>
        <div>
          <Label htmlFor="contact-reason">Reason for contacting us</Label>
          <Select value={values.reason} onValueChange={(v) => set("reason", v)}>
            <SelectTrigger id="contact-reason" className="mt-2 bg-white">
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
          <Label htmlFor="contact-message">Message</Label>
          <Textarea
            id="contact-message"
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            rows={4}
            placeholder="How can we help?"
            className="mt-2 bg-white"
            aria-invalid={!!errors.message}
          />
          {errors.message && (
            <p role="alert" className="mt-1.5 text-sm text-destructive">{errors.message}</p>
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
