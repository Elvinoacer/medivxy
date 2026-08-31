"use client";

import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { NewsletterSignup } from "@/components/site/newsletter-signup";
import { useLanguage } from "@/components/site/language-provider";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { services } from "@/lib/data";

export function SiteFooter() {
  const { t } = useLanguage();

  const exploreLinks = [
    { href: "/", label: t("footer.link.home") },
    { href: "/about", label: t("footer.link.about") },
    { href: "/services", label: t("footer.link.services") },
    { href: "/pharmacy", label: t("footer.link.pharmacy") },
    { href: "/products", label: t("footer.link.products") },
    { href: "/health-information", label: t("footer.link.health") },
    { href: "/request-medicine", label: t("footer.link.request") },
    { href: "/book", label: t("footer.link.book") },
    { href: "/track", label: t("footer.link.track") },
    { href: "/contact", label: t("footer.link.contact") },
  ];
  return (
    <footer className="mt-auto border-t bg-foreground pb-[calc(6rem+env(safe-area-inset-bottom))] text-background/85 lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <SiteLink href="/" ariaLabel="Medivyx Medical Care — home">
              <span className="inline-flex items-center gap-2.5 text-primary-foreground">
                <Logo className="[&_span.text-foreground]:text-background [&_.text-muted-foreground]:text-background/60" />
              </span>
            </SiteLink>
            <p className="mt-4 max-w-xs text-sm leading-6 text-background/70">
              {business.description} Serving the{" "}
              {business.area} community, {business.city}.
            </p>
            <p className="mt-4 inline-flex items-center rounded-full bg-background/10 px-3 py-1 text-xs text-background/75">
              <span aria-hidden="true">🌿</span> {t("footer.tagline")}
            </p>
          </div>

          {/* Explore */}
          <nav aria-label="Footer — explore">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-background/60">
              {t("footer.explore")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <SiteLink
                    href={l.href}
                    className="footer-link rounded-sm text-background/75 transition-colors hover:text-background"
                  >
                    {l.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <nav aria-label="Footer — services">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-background/60">
              {t("footer.services")}
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {services.map((s) => (
                <li key={s.slug}>
                  <SiteLink
                    href="/services"
                    className="footer-link rounded-sm text-background/75 transition-colors hover:text-background"
                  >
                    {s.name}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-background/60">
              {t("footer.visitContact")}
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-background/75">
              <li className="flex items-start gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  {business.name}
                  <br />
                  {business.area}, {business.city}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  {business.hours.map((h) => (
                    <span key={h.day} className="block">
                      {h.day}: {h.open} – {h.close}
                    </span>
                  ))}
                </span>
              </li>
              <li>
                <a
                  href={business.phoneHref}
                  className="inline-flex items-center gap-2.5 rounded-sm underline-offset-4 hover:text-background hover:underline"
                >
                  <Phone aria-hidden="true" className="size-4 shrink-0" />
                  {business.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${business.email}`}
                  className="inline-flex items-center gap-2.5 rounded-sm underline-offset-4 hover:text-background hover:underline"
                >
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  {business.email}
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(whatsappMessages.general)}
                  className="inline-flex items-center gap-2.5 rounded-sm underline-offset-4 hover:text-background hover:underline"
                >
                  <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
                  {t("footer.whatsappUs")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter band */}
        <Reveal>
          <div className="relative mt-10 overflow-hidden rounded-3xl bg-background/5 p-5 ring-1 ring-background/10 sm:p-7">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-6 -right-4 select-none text-[6rem] leading-none text-background/[0.06]"
            >
              🌿
            </span>
            <NewsletterSignup />
          </div>
        </Reveal>

        <div className="mt-12 border-t border-background/10 pt-6 text-xs text-background/55">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {business.name}. All rights reserved.
            </p>
            <p className="max-w-md text-background/45">
              Demo website — business details shown are placeholders until
              confirmed. Information on this site is general and does not
              replace advice from a qualified healthcare professional.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
