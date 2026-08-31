"use client";

import { useEffect } from "react";
import {
  CalendarCheck,
  Clock,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { BookingForm } from "@/components/site/booking-form";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";

/** Book a pharmacist consultation (research.md §6 services + roadmap Phase 4). */
export function BookView() {
  const { t } = useLanguage();
  useEffect(() => {
    track("page_view", { page: "book" });
  }, []);

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.book.eyebrow")}
        title={t("page.book.title")}
        description={t("page.book.desc")}
      />
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 pb-20 sm:px-6 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.9fr_1fr]">
            <BookingForm />

            {/* Aside — helpful context */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Reveal delay={1}>
                <div className="rounded-3xl border bg-card p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                    <Clock aria-hidden="true" className="size-4.5 text-primary" />
                    Opening hours
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm">
                    {business.hours.map((h) => (
                      <li
                        key={h.day}
                        className="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2 ring-1 ring-border/60"
                      >
                        <span className="text-foreground/80">{h.day}</span>
                        <span className="font-medium text-foreground">
                          {h.open} – {h.close}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Slots follow these hours — the last one starts an hour
                    before closing.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={2}>
                <div className="rounded-3xl border bg-card p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                    <FileText aria-hidden="true" className="size-4.5 text-primary" />
                    Good to know
                  </h2>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <CalendarCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                      Bring any prescriptions or medicines you&apos;d like reviewed.
                    </li>
                    <li className="flex gap-2">
                      <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                      Consultations happen at the pharmacy in {business.area}.
                    </li>
                    <li className="flex gap-2">
                      <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                      No payment needed — the team confirms each booking.
                    </li>
                  </ul>
                  <div className="mt-5 space-y-2">
                    <a
                      href={whatsappLink(whatsappMessages.general)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("whatsapp_click", { source: "book-aside" })}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1faa53] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#199047]"
                    >
                      <MessageCircle aria-hidden="true" className="size-4" />
                      Ask on WhatsApp first
                    </a>
                    <SiteLink
                      href="/contact"
                      trackLabel="book-aside-contact"
                      className="flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/60"
                    >
                      <Phone aria-hidden="true" className="size-4" />
                      Contact & location
                    </SiteLink>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
