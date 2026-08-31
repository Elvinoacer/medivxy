"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  MessageCircle,
  Phone,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductIcon } from "@/components/site/product-icon";
import { ProductCard } from "@/components/site/product-card";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { recordRecentProduct } from "@/components/site/recent-products";
import { ShareButton } from "@/components/site/share-button";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";
import { business, site, whatsappLink, whatsappMessages } from "@/lib/business";
import { formatAvailability, products } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

const TONE_STYLES = {
  in: "bg-mint text-mint-foreground",
  low: "bg-honey-soft text-accent-foreground",
  ask: "bg-secondary text-secondary-foreground",
} as const;

/** Product detail page (research.md §10). Print-friendly: CTAs and related
 *  products are dropped on paper, and a URL/date footer is added instead. */
export function ProductView({ product }: { product: Product }) {
  const { t } = useLanguage();
  // Date stamp for the print footer (lazy — computed once, never during render).
  const [printedOn] = useState(() =>
    new Date().toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  const availability = formatAvailability(product);
  const related = products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 3);

  useEffect(() => {
    track("product_view", { product: product.slug });
    recordRecentProduct(product.slug);
  }, [product.slug]);

  return (
    <main id="main-content">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-20 sm:px-6 sm:py-12">
        {/* Breadcrumb wayfinding */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: product.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          {/* Visual panel */}
          <Reveal>
            <div className="product-print-block sticky top-28">
              <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
                <div
                  aria-hidden="true"
                  className="brand-gradient-soft flex aspect-square items-center justify-center"
                >
                  <ProductIcon
                    name={product.icon}
                    category={product.category}
                    className="!size-28 !rounded-3xl shadow-lg"
                  />
                </div>
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                      TONE_STYLES[availability.tone]
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        availability.tone === "in" && "bg-emerald-600",
                        availability.tone === "low" && "bg-honey",
                        availability.tone === "ask" && "bg-muted-foreground/60"
                      )}
                    />
                    {availability.label}
                  </span>
                  {product.prescriptionRequired && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-sm">
                      <ShieldCheck aria-hidden="true" className="size-3.5" />
                      Prescription Required
                    </span>
                  )}
                </div>
              </div>
              <p className="no-print mt-3 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Info aria-hidden="true" className="size-3.5" />
                Demo catalogue image — availability confirmed by the team
              </p>
            </div>
          </Reveal>

          {/* Info panel */}
          <Reveal delay={1}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {product.category}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{product.tagline}</p>

            <Separator className="my-6" />

            <section aria-labelledby="about-product">
              <h2 id="about-product" className="text-sm font-semibold uppercase tracking-wide text-foreground">
                About this product
              </h2>
              <p className="mt-3 text-base leading-8 text-muted-foreground">
                {product.description}
              </p>
            </section>

            <section aria-labelledby="usage-product" className="mt-6">
              <h2 id="usage-product" className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Usage information
              </h2>
              <p className="mt-3 rounded-2xl bg-secondary/60 p-4 text-sm leading-7 text-secondary-foreground">
                {product.usageInfo}
              </p>
              {product.prescriptionRequired && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl bg-honey-soft/40 p-4 text-sm leading-6 text-accent-foreground">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  This medicine can only be dispensed against a valid
                  prescription. Use the Request Medicine page to submit one
                  for review.
                </p>
              )}
            </section>

            {/* CTAs (screen only) */}
            <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="flex-1 rounded-full bg-[#1faa53] px-6 text-white shadow-md shadow-[#1faa53]/25 hover:bg-[#199047]">
                <a
                  href={whatsappLink(whatsappMessages.product(product.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp_click", { source: "product-detail", product: product.slug })}
                >
                  <MessageCircle aria-hidden="true" className="size-4.5" />
                  Ask About Availability
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <a href={business.phoneHref} onClick={() => track("call_click", { source: "product-detail" })}>
                  <Phone aria-hidden="true" className="size-4.5" />
                  Call
                </a>
              </Button>
              <ShareButton
                title={product.name}
                text={product.tagline}
                url={`${site.url}/products/${product.slug}`}
                source="product-detail"
              />
              {product.prescriptionRequired && (
                <Button asChild size="lg" className="rounded-full px-6">
                  <SiteLink href="/request-medicine" trackLabel="product-request">
                    Request Medicine
                    <ArrowRight aria-hidden="true" className="size-4.5" />
                  </SiteLink>
                </Button>
              )}
            </div>
            {/* Print-only footer: URL + date + availability note. */}
            <div className="print-only mt-8 border-t border-black/20 pt-4 text-xs leading-5 text-black">
              <p className="font-semibold">{product.name} — {business.name}</p>
              <p>{site.url}/products/{product.slug}</p>
              <p>
                {t("print.productNote")} · {printedOn}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-16">
            <h2
              id="related-heading"
              className="font-display text-2xl font-semibold text-foreground"
            >
              More in {product.category}
            </h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal as="li" key={p.slug} delay={(i % 3) as 0 | 1 | 2}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
