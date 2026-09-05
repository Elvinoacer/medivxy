"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";
import { products } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

/** Category imagery map — self-explanatory photos per aisle. */
export const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  Medicines: "/images/category-medicines.webp",
  Wellness: "/images/category-wellness.webp",
  "Baby Care": "/images/category-baby.webp",
  "Personal Care": "/images/category-personal-care.webp",
  "Medical Supplies": "/images/category-medical-supplies.webp",
};

/**
 * "Shop by category" image tiles (products page) — tapping a tile filters the
 * catalogue below via ?cat=, giving the shop a visual storefront feel.
 */
export function CategoryShowcase({
  active,
  onPick,
}: {
  active?: string;
  onPick?: (cat: ProductCategory | "All") => void;
}) {
  const { t } = useLanguage();
  const counts = products.reduce((map, p) => {
    map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, new Map<string, number>());

  return (
    <section aria-labelledby="shop-categories-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t("shop.categories")}
              </p>
              <h2
                id="shop-categories-heading"
                className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Every aisle, one tap away
              </h2>
            </div>
          </div>
        </Reveal>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(["All", ...(Object.keys(CATEGORY_IMAGES) as ProductCategory[])] as const).map(
            (cat, i) => {
              const image = cat === "All" ? "/images/quick-shop.webp" : CATEGORY_IMAGES[cat];
              const isActive = active === cat;
              return (
                <Reveal as="li" key={cat} delay={(i % 5) as 0 | 1 | 2 | 3 | 4}>
                  <button
                    type="button"
                    onClick={() => onPick?.(cat)}
                    aria-pressed={isActive}
                    className={cn(
                      "group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg",
                      isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/15 to-transparent"
                    />
                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-3 text-left">
                      <span>
                        <span className="block text-sm font-semibold leading-tight text-white sm:text-base">
                          {cat === "All" ? "Everything" : cat}
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] text-white/80">
                          {cat === "All"
                            ? `${products.length} products`
                            : `${counts.get(cat) ?? 0} products`}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-white/90 transition-transform group-hover:translate-x-1"
                      />
                    </span>
                  </button>
                </Reveal>
              );
            }
          )}
        </ul>
      </div>
    </section>
  );
}
