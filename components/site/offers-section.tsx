"use client";

import { useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  Check,
  Copy,
  Gift,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";
import { formatKes } from "@/components/site/cart-provider";
import { PROMO_CODES, type PromoCode } from "@/lib/promos";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * "Current offers" — ticket-style cards that surface the demo promo codes
 * (single source of truth: lib/promos.ts, validated server-side at checkout).
 * Copy-to-clipboard makes the code one tap away from the checkout input.
 */

/** Per-card accent (mint / honey / primary cycle). */
const ACCENTS = [
  {
    icon: "bg-mint text-mint-foreground",
    code: "border-primary/40 bg-primary/5",
    focus: "focus-visible:outline-primary",
  },
  {
    icon: "bg-honey-soft text-accent-foreground",
    code: "border-accent/40 bg-accent/5",
    focus: "focus-visible:outline-accent",
  },
  {
    icon: "bg-primary/10 text-primary",
    code: "border-primary/40 bg-primary/5",
    focus: "focus-visible:outline-primary",
  },
] as const;

/** Static icon rendering (keeps react-hooks/static-components happy). */
function PromoIcon({ promo }: { promo: PromoCode }) {
  if (promo.freeDelivery)
    return <Truck aria-hidden="true" className="size-5.5" />;
  if (promo.percentOff > 0)
    return <BadgePercent aria-hidden="true" className="size-5.5" />;
  return <Sparkles aria-hidden="true" className="size-5.5" />;
}

/** Short, human terms derived from the promo definition (not hardcoded). */
function promoTerms(promo: PromoCode): string {
  const parts: string[] = [];
  if (promo.percentOff > 0) parts.push(`${promo.percentOff}% off`);
  if (promo.amountOff > 0) parts.push(`${formatKes(promo.amountOff)} off`);
  if (promo.freeDelivery) parts.push("free delivery — any zone");
  if (promo.maxDiscount > 0) parts.push(`up to ${formatKes(promo.maxDiscount)}`);
  if (promo.minSubtotal > 0) parts.push(`orders over ${formatKes(promo.minSubtotal)}`);
  return parts.join(" · ");
}

function OfferCard({
  promo,
  index,
}: {
  promo: PromoCode;
  index: number;
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const accent = ACCENTS[index % ACCENTS.length];

  async function copyCode() {
    track("promo_copy", { code: promo.code });
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
      toast.success(t("offers.copied"), {
        description: `${promo.code} · ${promo.label}`,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast(t("offers.copyFailed"), {
        description: promo.code,
      });
    }
  }

  return (
    <Reveal as="li" delay={(index + 1) as 1 | 2 | 3} className="h-full">
      <article className="ticket flex h-full flex-col rounded-2xl border-2 border-dashed border-primary/25 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full",
              accent.icon
            )}
          >
            <PromoIcon promo={promo} />
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-wider text-secondary-foreground">
            {t("offers.badge")}
          </span>
        </div>

        <h3 className="mt-4 text-base font-semibold leading-snug text-foreground">
          {promo.label}
        </h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {promoTerms(promo)}
        </p>

        <div className="mt-auto pt-5">
          <p
            id={`offer-code-${promo.code}`}
            className={cn(
              "rounded-xl border-2 border-dashed px-4 py-3 text-center font-mono text-lg font-bold tracking-[0.2em] text-foreground",
              accent.code
            )}
          >
            {promo.code}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void copyCode()}
              aria-labelledby={`offer-code-${promo.code}`}
              className={cn(
                "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:gap-3 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2",
                accent.focus,
                copied && "bg-mint text-mint-foreground"
              )}
            >
              {copied ? (
                <>
                  <Check aria-hidden="true" className="size-4" />
                  {t("offers.copiedBtn")}
                </>
              ) : (
                <>
                  <Copy aria-hidden="true" className="size-4" />
                  {t("offers.copy")}
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[0.6875rem] text-muted-foreground">
            {t("offers.applyHint")}
          </p>
        </div>
      </article>
    </Reveal>
  );
}

/** MediPoints explainer band — public discovery of the loyalty programme
 *  (numbers derived from lib/loyalty-shared.ts, the single source of truth). */
function MediPointsBand() {
  const { t } = useLanguage();
  const steps = [
    { icon: Sparkles, title: t("loyalty.step1Title"), desc: t("loyalty.step1Desc") },
    { icon: TrendingUp, title: t("loyalty.step2Title"), desc: t("loyalty.step2Desc") },
    { icon: Gift, title: t("loyalty.step3Title"), desc: t("loyalty.step3Desc") },
  ];
  const tiers = [
    { label: t("loyalty.tierFriend"), chip: "bg-background text-foreground ring-1 ring-emerald-700/30" },
    { label: t("loyalty.tierSilver"), chip: "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm ring-1 ring-slate-700/20" },
    { label: t("loyalty.tierGold"), chip: "bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-card to-mint/40 p-6 shadow-sm sm:p-8 dark:border-emerald-800/40 dark:from-emerald-950/25 dark:via-card dark:to-emerald-900/10">
      {/* Decorative floating points (aria-hidden, reduced-motion safe) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 select-none font-display text-[7rem] font-black leading-none text-emerald-600/8 dark:text-emerald-300/8"
      >
        +
      </span>

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
            <Sparkles aria-hidden="true" className="size-4" />
            {t("loyalty.eyebrow")}
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("loyalty.title")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("loyalty.desc")}
          </p>
        </div>
        {/* Tier ladder — the earn-rate ladder at a glance */}
        <div className="flex items-center gap-1.5" aria-label="MediPoints tiers">
          {tiers.map((tier, i) => (
            <span key={tier.label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider",
                  tier.chip
                )}
              >
                {tier.label}
              </span>
              {i < tiers.length - 1 && (
                <span aria-hidden="true" className="text-muted-foreground/50">
                  <ArrowRight className="size-3.5" />
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <ol className="relative mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="flex items-start gap-3 rounded-2xl border border-emerald-100/80 bg-background/70 p-4 dark:border-emerald-800/30"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300">
              <s.icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                <span className="mr-1.5 font-mono text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80">{i + 1}.</span>
                {s.title}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="relative mt-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs leading-5 text-muted-foreground">
          {t("loyalty.footnote")}
        </p>
        <SiteLink
          href="/products"
          trackLabel="loyalty-band-shop"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:gap-3.5 hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {t("loyalty.cta")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </SiteLink>
      </div>
    </div>
  );
}

export function OffersSection() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="offers-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
        <SectionHeading
          eyebrow={t("offers.eyebrow")}
          titleId="offers-heading"
          title={t("offers.title")}
          description={t("offers.desc")}
        />

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROMO_CODES.map((promo, i) => (
            <OfferCard key={promo.code} promo={promo} index={i} />
          ))}
        </ul>

        {/* MediPoints — the loyalty programme, discoverable BEFORE checkout. */}
        <Reveal className="mt-8">
          <MediPointsBand />
        </Reveal>

        <Reveal className="mt-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            {t("offers.footnote")}
          </p>
          <SiteLink
            href="/products"
            trackLabel="offers-shop"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:gap-3.5 hover:border-primary/40 hover:shadow"
          >
            {t("offers.shopCta")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </SiteLink>
        </Reveal>
      </div>
    </section>
  );
}
