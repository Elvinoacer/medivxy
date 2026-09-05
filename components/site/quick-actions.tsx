"use client";

import Image from "next/image";
import { ArrowRight, CalendarCheck, PackageSearch, Pill, ShoppingBag } from "lucide-react";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";

/**
 * "What do you need today?" — the attention-capturing quick-actions hub.
 *
 * A bento-style router that sits right under the hero: every core journey
 * (shop · book · prescription · track) is one visual, labelled tap away, so
 * nobody has to scroll-and-hunt through a linear page to find their path.
 */
export function QuickActions() {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="quick-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-16">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t("quick.eyebrow")}
          </p>
          <h2
            id="quick-heading"
            className="mt-3 text-center font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {t("quick.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base leading-7 text-muted-foreground">
            {t("quick.desc")}
          </p>
        </Reveal>

        {/* Bento grid — one hero tile + three supporting tiles */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Shop — the flagship tile */}
          <Reveal className="sm:col-span-2 lg:row-span-2">
            <SiteLink
              href="/products"
              trackLabel="quick-shop"
              className="group relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl shadow-md lg:min-h-[420px]"
              ariaLabel={t("quick.shop")}
            >
              <Image
                src="/images/quick-shop.webp"
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent"
              />
              <div className="relative p-6 sm:p-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-honey px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-wide text-honey-foreground shadow-sm">
                  <ShoppingBag aria-hidden="true" className="size-3.5" />
                  Buy online
                </span>
                <h3 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
                  {t("quick.shop")}
                </h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-white/85">
                  {t("quick.shopSub")}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-foreground shadow-md transition-all group-hover:gap-3.5 group-hover:bg-white">
                  {t("shop.browseAll")}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              </div>
            </SiteLink>
          </Reveal>

          {/* Book */}
          <Reveal delay={1}>
            <QuickTile
              href="/book"
              trackLabel="quick-book"
              image="/images/quick-book.webp"
              icon={CalendarCheck}
              title={t("quick.book")}
              sub={t("quick.bookSub")}
            />
          </Reveal>

          {/* Prescription */}
          <Reveal delay={2}>
            <QuickTile
              href="/request-medicine"
              trackLabel="quick-rx"
              image="/images/quick-rx.webp"
              icon={Pill}
              title={t("quick.rx")}
              sub={t("quick.rxSub")}
            />
          </Reveal>

          {/* Track — spans on mobile-friendly layout */}
          <Reveal delay={3} className="sm:col-span-2 lg:col-span-1">
            <QuickTile
              href="/track"
              trackLabel="quick-track"
              image="/images/quick-track.webp"
              icon={PackageSearch}
              title={t("quick.track")}
              sub={t("quick.trackSub")}
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function QuickTile({
  href,
  trackLabel,
  image,
  icon: Icon,
  title,
  sub,
}: {
  href: string;
  trackLabel: string;
  image: string;
  icon: typeof CalendarCheck;
  title: string;
  sub: string;
}) {
  return (
    <SiteLink
      href={href}
      trackLabel={trackLabel}
      className="group relative flex h-full min-h-[210px] flex-col justify-end overflow-hidden rounded-3xl shadow-md"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent"
      />
      <div className="relative p-5 sm:p-6">
        <span className="flex size-10 items-center justify-center rounded-full bg-white/95 text-primary shadow-md">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <h3 className="mt-3 font-display text-lg font-semibold text-white sm:text-xl">{title}</h3>
        <p className="mt-0.5 text-xs leading-5 text-white/85">{sub}</p>
      </div>
    </SiteLink>
  );
}
