"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import { useLanguage } from "@/components/site/language-provider";
import { isValidKenyanPhone, PHONE_HINT } from "@/lib/validation";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface LoyaltyQuote {
  phone: string;
  points: number;
  lifetimePoints: number;
  tier: "friend" | "silver" | "gold";
  tierLabel: string;
  multiplier: number;
  nextAt: number | null;
  nextLabel: string | null;
  orders: number;
}

/**
 * "Your MediPoints" — balance lookup on the track page.
 *
 * The customer types the phone number they order with (their M-Pesa
 * identity); the SERVER returns the balance it holds for that number.
 * Nothing else is exposed — no order history, no names.
 */
export function MediPointsCard() {
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [quote, setQuote] = useState<LoyaltyQuote | null>(null);
  const [noAccount, setNoAccount] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onCheck(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim();
    if (!isValidKenyanPhone(trimmed)) {
      setError(t("points.invalidPhone"));
      setQuote(null);
      setNoAccount(false);
      return;
    }
    setLoading(true);
    setQuote(null);
    setNoAccount(false);
    try {
      const res = await fetch(
        `/api/loyalty?phone=${encodeURIComponent(trimmed)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(t("points.error"));
        return;
      }
      if (data.account) {
        setQuote(data.account as LoyaltyQuote);
        track("page_view", { page: "medipoints-lookup" });
      } else {
        setNoAccount(true);
      }
    } catch {
      setError(t("points.error"));
    } finally {
      setLoading(false);
    }
  }

  // Tier-progress math (friend 0–499 · silver 500–1499 · gold 1500+).
  const tierFloor = quote
    ? quote.tier === "gold"
      ? 1500
      : quote.tier === "silver"
        ? 500
        : 0
    : 0;
  const progress = quote
    ? quote.nextAt !== null
      ? Math.min(
          100,
          Math.round(
            ((quote.lifetimePoints - tierFloor) / (quote.nextAt - tierFloor)) * 100
          )
        )
      : 100
    : 0;

  return (
    <Reveal className="mt-4">
      <section
        aria-labelledby="medipoints-card-heading"
        className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-card to-mint/30 p-6 shadow-sm sm:p-8 dark:border-emerald-800/40 dark:from-emerald-950/25 dark:via-card dark:to-emerald-900/10"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-10 select-none font-display text-[6rem] font-black leading-none text-emerald-600/8 dark:text-emerald-300/8"
        >
          ✦
        </span>

        <div className="relative">
          <h2
            id="medipoints-card-heading"
            className="flex items-center gap-2.5 font-display text-xl font-semibold text-foreground"
          >
            <Sparkles aria-hidden="true" className="size-5 text-emerald-700 dark:text-emerald-400" />
            {t("points.cardTitle")}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("points.cardDesc")}
          </p>

          <form onSubmit={onCheck} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border bg-background px-4 transition-all focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 dark:focus-within:border-emerald-400">
              <label htmlFor="mp-phone" className="sr-only">
                {t("points.phoneLabel")}
              </label>
              <span aria-hidden="true" className="text-xs font-semibold text-muted-foreground">
                +254
              </span>
              <input
                id="mp-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                placeholder={t("points.phonePlaceholder")}
                autoComplete="tel"
                aria-invalid={!!error}
                aria-describedby={error ? "mp-error" : "mp-hint"}
                className="h-12 min-w-0 flex-1 bg-transparent font-mono text-sm tracking-wide outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/70"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 rounded-2xl bg-emerald-700 px-6 font-semibold text-white hover:bg-emerald-800"
            >
              {loading ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4.5 animate-spin" />
                  {t("points.checking")}
                </>
              ) : (
                <>
                  <Sparkles aria-hidden="true" className="size-4.5" />
                  {t("points.check")}
                </>
              )}
            </Button>
          </form>
          <p id="mp-hint" className="mt-1.5 text-[0.6875rem] text-muted-foreground">
            {PHONE_HINT}
          </p>
          {error && (
            <p id="mp-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          {/* Result: balance + tier + progress */}
          {quote && (
            <div className="points-in mt-5 rounded-2xl border border-emerald-100/80 bg-background/80 p-4 sm:p-5 dark:border-emerald-800/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-display text-3xl font-bold tabular-nums text-foreground">
                  {quote.points.toLocaleString("en-KE")}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {t("points.balance")}
                  </span>
                </p>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wider",
                    quote.tier === "gold"
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950"
                      : quote.tier === "silver"
                        ? "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm ring-1 ring-slate-700/20"
                        : "bg-background text-foreground ring-1 ring-emerald-700/30"
                  )}
                >
                  {quote.tierLabel}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>
                    {t("points.tier")} · {quote.multiplier}× {t("points.earnRate").toLowerCase()}
                  </span>
                  <span>
                    {quote.nextAt !== null
                      ? `${Math.max(0, quote.nextAt - quote.lifetimePoints).toLocaleString("en-KE")} ${t("points.toNext")}`
                      : t("points.topTier")}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progress to next MediPoints tier"
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-emerald-600/10"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-[width] duration-700 dark:from-emerald-400 dark:to-emerald-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-emerald-100/60 pt-3 dark:border-emerald-800/30 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  {t("points.spendHint")}
                  {" · "}
                  {quote.orders} {t("points.orders")}
                </p>
                <SiteLink
                  href="/products"
                  trackLabel="medipoints-shop"
                  className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition-all hover:gap-3 hover:bg-emerald-800"
                >
                  {t("points.shopCta")}
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </SiteLink>
              </div>
            </div>
          )}

          {/* Result: no account yet */}
          {noAccount && !quote && (
            <p className="points-in mt-5 flex items-start gap-2 rounded-2xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
              <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-700/70 dark:text-emerald-400/70" />
              {t("points.noAccount")}
            </p>
          )}

          <p className="mt-4 flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
            {t("points.privacy")}
          </p>
        </div>
      </section>
    </Reveal>
  );
}
