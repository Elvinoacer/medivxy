"use client";

import { useEffect } from "react";
import { CalendarCheck, ArrowRight, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { ServicesSection } from "@/components/site/services-section";
import { FaqSection } from "@/components/site/faq-section";
import { CtaBand } from "@/components/site/cta-band";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";

export function ServicesView() {
  const { t } = useLanguage();
  useEffect(() => {
    track("page_view", { page: "services" });
  }, []);

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.services.eyebrow")}
        title={t("page.services.title")}
        description={t("page.services.desc")}
      />
      <ServicesSection detailed />

      {/* Book a consultation */}
      <section aria-label="Book a consultation" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground shadow-lg sm:p-10">
              <div
                aria-hidden="true"
                className="absolute -right-10 -top-10 size-44 rounded-full bg-white/10 blur-2xl"
              />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary-foreground/75">
                    <CalendarCheck aria-hidden="true" className="size-4" />
                    Free consultations
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                    Book time with a pharmacist
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-primary-foreground/85 sm:text-base">
                    Pick a slot that suits you — medicine questions, a
                    prescription review or a blood pressure check. The team
                    confirms every booking by phone or WhatsApp.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                  <SiteLink
                    href="/book"
                    trackLabel="services-book-cta"
                    ariaLabel="Book a consultation with a pharmacist"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-primary shadow-md transition-all duration-200 hover:bg-white active:scale-[0.97] sm:text-base"
                  >
                    <CalendarCheck aria-hidden="true" className="size-4.5" />
                    Book a Consultation
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </SiteLink>
                  <a
                    href={whatsappLink(whatsappMessages.general)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("whatsapp_click", { source: "services-book" })}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-foreground/30 px-5 py-2.5 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-white/10"
                  >
                    <MessageCircle aria-hidden="true" className="size-4" />
                    Or ask on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FaqSection />
      <CtaBand />
    </main>
  );
}
