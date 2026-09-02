"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, PackageSearch, Info, ArrowUpDown, RotateCcw } from "lucide-react";
import { ProductCard } from "@/components/site/product-card";
import { ProductCompare } from "@/components/site/product-compare";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { products, productCategories } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

type SortKey = "featured" | "name" | "availability";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured order",
  name: "Name A–Z",
  availability: "Availability first",
};

const AVAILABILITY_RANK: Record<string, number> = {
  "in-stock": 0,
  "low-stock": 1,
  ask: 2,
};

const MAX_COMPARE = 3;

/**
 * Product catalogue (research.md §9): search + category filters +
 * side-by-side comparison (up to 3 items).
 * Prescription-only items are clearly flagged; nothing is purchasable.
 */
export function ProductCatalogue({
  initialCategory = "All",
  limit,
  showHeading = true,
}: {
  initialCategory?: ProductCategory | "All";
  limit?: number;
  showHeading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "All">(initialCategory);
  const [sort, setSort] = useState<SortKey>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [compareSlugs, setCompareSlugs] = useState<string[]>([]);

  // Search analytics: fire once the query settles (800ms after the last
  // keystroke, 3+ characters) and only when it changed — previously every
  // single keystroke sent an event, drowning the dashboard in noise.
  const searchTrackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrackedQueryRef = useRef("");
  useEffect(() => {
    const q = query.trim();
    if (q === lastTrackedQueryRef.current) return;
    if (searchTrackRef.current) clearTimeout(searchTrackRef.current);
    if (q.length < 3) return;
    searchTrackRef.current = setTimeout(() => {
      track("search", { query: q.slice(0, 60), source: "catalogue" });
      lastTrackedQueryRef.current = q;
    }, 800);
    return () => {
      if (searchTrackRef.current) clearTimeout(searchTrackRef.current);
    };
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = products;
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (inStockOnly) list = list.filter((p) => p.availability !== "ask");
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "availability") {
      list = [...list].sort(
        (a, b) =>
          AVAILABILITY_RANK[a.availability] - AVAILABILITY_RANK[b.availability] ||
          a.name.localeCompare(b.name)
      );
    }
    return limit ? list.slice(0, limit) : list;
  }, [query, category, sort, inStockOnly, limit]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, []);

  const compareProducts = useMemo(
    () =>
      compareSlugs
        .map((slug) => products.find((p) => p.slug === slug))
        .filter((p): p is (typeof products)[number] => Boolean(p)),
    [compareSlugs]
  );

  function toggleCompare(slug: string) {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_COMPARE) return prev; // limit reached
      return [...prev, slug];
    });
  }

  return (
    <div>
      {showHeading && (
        <SectionHeading
          eyebrow="Products"
          titleId="catalogue-heading"
          title="Healthcare essentials, clearly organised"
          description="Browse the demo catalogue. For current stock and prices, ask the team — items marked Prescription Required need a valid prescription."
        />
      )}

      {/* Controls */}
      <Reveal delay={1} className="mx-auto mt-8 max-w-3xl">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border bg-card px-4 shadow-sm">
            <label htmlFor="catalogue-search" className="sr-only">
              Search products
            </label>
            <Search aria-hidden="true" className="size-4.5 shrink-0 text-muted-foreground" />
            <input
              id="catalogue-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              autoComplete="off"
              aria-describedby="catalogue-count"
            />
          </div>
          <div className="flex h-12 shrink-0 items-center gap-2 rounded-full border bg-card pl-4 pr-2 shadow-sm">
            <ArrowUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <label htmlFor="catalogue-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="catalogue-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-full min-w-36 cursor-pointer appearance-none bg-transparent pr-2 text-sm font-medium text-foreground outline-none"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter by category"
          className="scrollbar-thin mt-4 flex flex-wrap justify-center gap-2"
        >
          {(["All", ...productCategories] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                category === cat
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-primary"
              )}
            >
              {cat}
              {cat !== "All" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[0.625rem] font-semibold",
                    category === cat ? "bg-primary-foreground/20" : "bg-muted"
                  )}
                >
                  {counts.get(cat) ?? 0}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={inStockOnly}
            onClick={() => setInStockOnly((v) => !v)}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all",
              inStockOnly
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-primary"
            )}
          >
            <PackageSearch aria-hidden="true" className="size-3.5" />
            In stock only
          </button>
        </div>

        <p id="catalogue-count" aria-live="polite" className="mt-4 text-center text-xs text-muted-foreground">
          Showing {filtered.length} of {products.length} products
        </p>
      </Reveal>

      {/* Results */}
      {filtered.length > 0 ? (
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product, i) => (
            <Reveal as="li" key={product.slug} delay={(i % 3) as 0 | 1 | 2}>
              <ProductCard
                product={product}
                compare={{
                  selected: compareSlugs.includes(product.slug),
                  onToggle: () => toggleCompare(product.slug),
                  disabled: compareSlugs.length >= MAX_COMPARE,
                }}
              />
            </Reveal>
          ))}
        </ul>
      ) : (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed bg-card p-8 text-center">
          <PackageSearch aria-hidden="true" className="mx-auto size-10 text-muted-foreground/60" />
          <p className="mt-3 font-medium text-foreground">
            No products match “{query}”
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Many items are not listed online — ask the team and they&apos;ll
            check for you.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
                setInStockOnly(false);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:text-primary"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Clear search & filters
            </button>
            <a
              href="https://wa.me/254700000000?text=Hi%20Medivyx%2C%20I'm%20looking%20for%20a%20product%20I%20can't%20find%20on%20your%20website."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "catalogue-empty" })}
              className="wa-cta inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      )}

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Info aria-hidden="true" className="size-3.5 shrink-0" />
        Demo catalogue — availability and stock shown are illustrative and
        confirmed by the team in person.
      </p>

      {/* Comparison tray + dialog (only with a selection) */}
      <ProductCompare
        products={compareProducts}
        onRemove={(slug) => setCompareSlugs((prev) => prev.filter((s) => s !== slug))}
        onClear={() => setCompareSlugs([])}
      />
    </div>
  );
}
