"use client";

import { useEffect } from "react";
import { Phone, Mail, MessageCircle, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { ContactForm } from "@/components/site/contact-form";
import { LocationCard } from "@/components/site/location-card";
import { Reveal } from "@/components/site/reveal";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";

/** Contact page (research.md §17). */
export function ContactView() {
  const { t } = useLanguage();
  useEffect(() => {
    track("page_view", { page: "contact" });
  }, []);

  const channels = [
    {
      icon: Phone,
      title: "Call Us",
      value: business.phone,
      href: business.phoneHref,
      note: "During opening hours",
      onClick: () => track("call_click", { source: "contact-channel" }),
      external: false,
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      value: business.whatsappDisplay,
      href: whatsappLink(whatsappMessages.general),
      note: "Fastest way to reach us",
      onClick: () => track("whatsapp_click", { source: "contact-channel" }),
      external: true,
    },
    {
      icon: Mail,
      title: "Email",
      value: business.email,
      href: `mailto:${business.email}`,
      note: "For written enquiries",
      onClick: undefined,
      external: false,
    },
  ];

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.contact.eyebrow")}
        title={t("page.contact.title")}
        description={t("page.contact.desc")}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
            {/* Channels + location */}
            <div className="space-y-8">
              <Reveal>
                <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  {channels.map((ch) => (
                    <li key={ch.title}>
                      <a
                        href={ch.href}
                        {...(ch.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        onClick={ch.onClick}
                        className="group flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/25"
                      >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <ch.icon aria-hidden="true" className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {ch.title}
                          </span>
                          <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                            {ch.value}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {ch.note}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <LocationCard />

              <Reveal delay={1}>
                <div className="rounded-2xl border bg-accent/40 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                    <Clock aria-hidden="true" className="size-4" />
                    Opening hours
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-accent-foreground/80">
                    {business.hours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-4">
                        <span>{h.day}</span>
                        <span className="font-medium">
                          {h.open} – {h.close}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-accent-foreground/60">
                    {business.hoursNote}
                  </p>
                </div>
              </Reveal>
            </div>

            {/* Form */}
            <Reveal delay={1}>
              <ContactForm />
            </Reveal>
          </div>
        </div>
      </section>

      {/* NAP + map intent for discoverability (research.md §21) */}
      <section className="border-t bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Reveal>
            <address className="mx-auto flex max-w-xl flex-col items-center gap-1.5 text-center text-sm not-italic text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <MapPin aria-hidden="true" className="size-4 text-primary" />
                {business.name}
              </span>
              <span>
                {business.area}, {business.city}, {business.country}
              </span>
              <a href={business.phoneHref} className="hover:text-primary">
                {business.phone}
              </a>
              <a href={`mailto:${business.email}`} className="hover:text-primary">
                {business.email}
              </a>
            </address>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
