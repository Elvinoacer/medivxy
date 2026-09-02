"use client";

import { useState, type FormEvent } from "react";
import { Check, Loader2, Mail, Send } from "lucide-react";
import { track } from "@/lib/analytics";
import { useLanguage } from "@/components/site/language-provider";

/**
 * Footer newsletter sign-up — "Stay well" health tips.
 * Demo storage only (no emails are sent); consent-gated analytics fire
 * a newsletter_signup event on success.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterSignup() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage(t("news.invalid"));
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "footer" }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("done");
        setMessage(t("news.successMsg"));
        track("newsletter_signup", { source: "footer" });
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong — please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network hiccup — please try again.");
    }
  }

  if (status === "done") {
    return (
      <div
        role="status"
        className="flex flex-wrap items-center gap-3 rounded-2xl bg-background/10 p-5"
      >
        <span className="check-pop flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check aria-hidden="true" className="size-4.5" />
        </span>
        <p className="text-sm leading-6 text-background/85">
          <span className="font-semibold text-background">
            {t("news.successTitle")}
          </span>{" "}
          {message}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center"
    >
      <div>
        <label
          htmlFor="newsletter-email"
          className="text-sm font-semibold text-background"
        >
          {t("news.title")}
        </label>
        <p className="mt-1 text-sm leading-6 text-background/70">
          {t("news.desc")}
        </p>
      </div>
      <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-background/20 bg-background/10 pl-4 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
        <Mail
          aria-hidden="true"
          className="size-4 shrink-0 text-background/60"
        />
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value.slice(0, 254));
            if (status === "error") setStatus("idle");
          }}
          placeholder="you@example.com"
          aria-describedby="newsletter-hint"
          aria-invalid={status === "error"}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-background outline-none placeholder:text-background/45"
        />
        <button
          type="submit"
          disabled={status === "sending" || email.trim().length === 0}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background disabled:opacity-60 sm:px-5"
        >
          {status === "sending" ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Send aria-hidden="true" className="size-4" />
          )}
          <span className="hidden sm:inline">
            {status === "sending" ? t("news.joining") : t("news.subscribe")}
          </span>
          <span className="sr-only sm:hidden">
            {status === "sending" ? t("news.joining") : t("news.subscribe")}
          </span>
        </button>
      </div>
      <p
        id="newsletter-hint"
        aria-live="polite"
        className={
          "text-xs sm:col-span-2 " +
          (status === "error"
            ? "font-medium text-red-300 dark:text-red-500"
            : "text-background/55")
        }
      >
        {status === "error"
          ? message
          : t("news.demoNote")}
      </p>
    </form>
  );
}
