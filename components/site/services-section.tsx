"use client";

import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { ProductIcon } from "@/components/site/product-icon";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";
import { services } from "@/lib/data";

/** Service imagery (photos that explain the service at a glance). */
const SERVICE_IMAGES: Record<string, string> = {
  "pharmacy-services": "/images/category-medicines.webp",
  "healthcare-products": "/images/quick-shop.webp",
  "prescription-support": "/images/quick-rx.webp",
  "personal-family-care": "/images/category-baby.webp",
  "medical-supplies": "/images/category-medical-supplies.webp",
  "customer-support": "/images/service-support.webp",
};

/** Service grid with photography — each card leads with a self-explanatory
 *  image, the icon chip anchors the corner, and the copy stays scannable. */
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
          {services.map((service, i) => {
            const image = SERVICE_IMAGES[service.slug] ?? "/images/quick-shop.webp";
            return (
              <Reveal as="li" key={service.slug} delay={(i % 3) as 0 | 1 | 2}>
                <article className="group relative h-full overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/8 hover:ring-1 hover:ring-primary/25">
                  <SiteLink
                    href="/services"
                    ariaLabel={`Learn more about ${service.name}`}
                    className="relative block h-36 overflow-hidden"
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent"
                    />
                    <span className="absolute -bottom-5 left-5 translate-y-1 rounded-2xl bg-card p-2.5 shadow-md ring-1 ring-border">
                      <ProductIcon name={service.icon} className="!size-10 !rounded-xl" />
                    </span>
                  </SiteLink>
                  <div className="p-6 pt-7">
                    <h3 className="font-display text-xl font-semibold text-foreground">
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
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
