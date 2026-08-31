"use client";

import Image from "next/image";
import { ArrowRight, MapPin, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";
import { OpenTodayCard } from "@/components/site/open-today-card";

/**
 * Homepage hero (research.md §4 & §30).
 * Communicates: name, healthcare positioning, local presence, contact, CTA.
 * Copy is bilingual (EN/SW) via the language provider.
 */
export function Hero() {
  const { t, lang } = useLanguage();
  return (
    <section className="relative overflow-hidden" aria-labelledby="hero-heading">
      {/* Soft brand wash */}
      <div aria-hidden="true" className="absolute inset-0 brand-gradient-soft" />
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-16 size-[420px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-24 size-[380px] rounded-full bg-honey-soft/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Copy */}
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
                <MapPin aria-hidden="true" className="size-3.5" />
                {business.area} • {business.city}
              </p>
            </Reveal>

            <Reveal delay={1}>
              <h1
                id="hero-heading"
                className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[4.2rem]"
              >
                {t("hero.headline1")}{" "}
                <span className="relative inline-block text-primary">
                  {t("hero.headline2")}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 220 12"
                    className="absolute -bottom-2 left-0 w-full text-honey"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M3 9c40-6 140-6 214-3"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                      className="hero-underline"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={2}>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                {t("hero.sub")}
              </p>
            </Reveal>

            <Reveal delay={3}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button asChild size="lg" className="rounded-full px-7 text-base shadow-md shadow-primary/20">
                  <SiteLink href="/request-medicine" trackLabel="hero-request-medicine">
                    {t("header.requestMedicine")}
                    <ArrowRight aria-hidden="true" className="size-4.5" />
                  </SiteLink>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-7 text-base">
                  <a
                    href={whatsappLink(
                      lang === "sw" ? t("whatsapp.general") : whatsappMessages.general
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("whatsapp_click", { source: "hero" })}
                  >
                    <MessageCircle aria-hidden="true" className="size-4.5" />
                    {t("hero.talk")}
                  </a>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={4}>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <a
                  href={business.phoneHref}
                  onClick={() => track("call_click", { source: "hero" })}
                  className="inline-flex items-center gap-1.5 font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {business.phone}
                </a>
                <span aria-hidden="true" className="hidden size-1 rounded-full bg-border sm:block" />
                <SiteLink
                  href="/services"
                  className="inline-flex items-center gap-1.5 font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline"
                >
                  {t("hero.exploreServices")}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </SiteLink>
              </div>
            </Reveal>
          </div>

          {/* Image */}
          <Reveal delay={2} className="relative">
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-honey-soft/60 blur-xl"
              />
              <div className="relative overflow-hidden rounded-[1.75rem] shadow-xl shadow-foreground/10 ring-1 ring-border">
                <Image
                  src="/images/hero-pharmacy.webp"
                  alt="Inside the Medivyx pharmacy — warm, well-organised shelves of healthcare products"
                  width={1536}
                  height={768}
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="aspect-[2/1] w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent"
                />
              </div>

              {/* Floating cards */}
              <div className="float-soft absolute -bottom-5 left-4 hidden rounded-2xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-border backdrop-blur sm:block">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle aria-hidden="true" className="size-4" />
                  </span>
                  {t("hero.cardTitle")}
                </p>
                <p className="mt-1 pl-10 text-xs text-muted-foreground">
                  {t("hero.cardSub")}
                </p>
              </div>
              <OpenTodayCard />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
