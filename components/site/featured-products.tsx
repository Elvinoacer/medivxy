"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import { getFeaturedProducts, productCategories, products } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Homepage shop explorer — tabs switch the visible slice of the catalogue
 * (featured · per-category) so the section invites interaction instead of
 * being a static strip. Horizontal scroll on mobile keeps one-hand browsing.
 */
export function FeaturedProducts() {
  const [tab, setTab] = useState<string>("featured");

  const items = useMemo(() => {
    if (tab === "featured") return getFeaturedProducts().slice(0, 8);
    return products.filter((p) => p.category === tab).slice(0, 8);
  }, [tab]);

  return (
    <section aria-labelledby="featured-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Popular right now"
          titleId="featured-heading"
          title="Products your neighbours ask for most"
          description="Tap a category, add to basket and pay your way — M-Pesa, card or on collection."
        />

        {/* Category tabs */}
        <div
          role="tablist"
          aria-label="Product categories"
          className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
        >
          {["featured", ...productCategories].map((cat) => {
            const active = tab === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  setTab(cat);
                  track("shop_tab_click", { category: cat, source: "home" });
                }}
                className={cn(
                  "min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground/75 hover:border-primary/40 hover:text-primary"
                )}
              >
                {cat === "featured" ? "Featured" : cat}
              </button>
            );
          })}
        </div>

        {/* Products — horizontal swipe on mobile, grid on desktop */}
        <ul
          role="tabpanel"
          aria-label={tab === "featured" ? "Featured products" : `${tab} products`}
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-thin sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-4"
        >
          {items.map((product, i) => (
            <li
              key={product.slug}
              className="w-[78%] shrink-0 snap-start sm:w-auto"
            >
              <Reveal delay={(i % 4) as 0 | 1 | 2 | 3} className="h-full">
                <ProductCard product={product} />
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal delay={2} className="mt-8 text-center">
          <SiteLink
            href="/products"
            trackLabel="featured-all-products"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:gap-3 hover:text-primary"
          >
            Browse all products
            <ArrowRight aria-hidden="true" className="size-4" />
          </SiteLink>
        </Reveal>
      </div>
    </section>
  );
}
