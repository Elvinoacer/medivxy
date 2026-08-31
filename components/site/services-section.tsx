"use client";

import { ArrowRight, Check } from "lucide-react";
import { ProductIcon } from "@/components/site/product-icon";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";
import { services } from "@/lib/data";

/** Polished service grid (research.md §6). Bilingual section heading. */
export function ServicesSection({ detailed = false }: { detailed?: boolean }) {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="services-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow={t("services.section.eyebrow")}
          titleId="services-heading"
          title={t("services.section.title")}
          description={t("services.section.desc")}
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal as="li" key={service.slug} delay={(i % 3) as 0 | 1 | 2}>
              <article className="group relative h-full rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/8 hover:ring-1 hover:ring-primary/25">
                <ProductIcon
                  name={service.icon}
                  className="!size-13 !rounded-2xl"
                />
                <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                  {service.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {detailed ? service.description : service.short}
                </p>
                {detailed && (
                  <ul className="mt-4 space-y-2">
                    {service.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-foreground/75"
                      >
                        <Check
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-primary"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                <SiteLink
                  href="/services"
                  ariaLabel={`Learn more about ${service.name}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 transition-all group-hover:gap-2.5 group-hover:underline"
                >
                  Learn more
                  <ArrowRight aria-hidden="true" className="size-4" />
                </SiteLink>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
