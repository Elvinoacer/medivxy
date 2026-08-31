"use client";

import { useEffect, useState } from "react";
import { History, ArrowRight } from "lucide-react";
import { ProductIcon } from "@/components/site/product-icon";
import { SiteLink } from "@/components/site/link";
import { getProduct } from "@/lib/data";

const STORAGE_KEY = "medivyx:recent-products";
const MAX_ITEMS = 6;

/** Record a viewed product slug (most-recent-first, deduped, capped). */
export function recordRecentProduct(slug: string) {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const slugs = Array.isArray(raw)
      ? raw.filter((s): s is string => typeof s === "string")
      : [];
    const next = [slug, ...slugs.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* localStorage unavailable (private mode) — feature silently disabled */
  }
}

/**
 * "Recently viewed" strip for the products page (research.md §9 engagement).
 * Pure client feature backed by localStorage; renders nothing until mounted
 * and only when the visitor has viewed at least one product.
 */
export function RecentProducts() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    // Read localStorage after mount (indirect setState — SSR stays stable and
    // the strip appears only in the browser, matching the open-status pattern).
    const read = () => {
      try {
        const raw: unknown = JSON.parse(
          localStorage.getItem(STORAGE_KEY) ?? "[]",
        );
        if (Array.isArray(raw)) {
          setSlugs(raw.filter((s): s is string => typeof s === "string"));
        }
      } catch {
        /* ignore */
      }
    };
    read();
  }, []);

  if (slugs.length === 0) return null;

  const items = slugs
    .map((slug) => getProduct(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="recent-products-heading"
      className="mx-auto mb-12 max-w-6xl"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="recent-products-heading"
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          <History aria-hidden="true" className="size-4 text-primary" />
          Recently viewed
        </h2>
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="scrollbar-thin mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
        {items.map((product) => (
          <li key={product.slug} className="snap-start">
            <SiteLink
              href={`/products/${product.slug}`}
              trackLabel="recent-product"
              ariaLabel={`View details for ${product.name}`}
              className="group flex w-60 items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/25"
            >
              <span className="shrink-0 transition-transform duration-300 group-hover:scale-105">
                <ProductIcon name={product.icon} category={product.category} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                  {product.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {product.category}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </SiteLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
