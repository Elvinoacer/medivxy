"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { ProductCatalogue } from "@/components/site/product-catalogue";
import { CategoryShowcase } from "@/components/site/category-showcase";
import { RecentProducts } from "@/components/site/recent-products";
import { CtaBand } from "@/components/site/cta-band";
import { track } from "@/lib/analytics";
import type { ProductCategory } from "@/lib/types";

const VALID_CATS = new Set([
  "All",
  "Medicines",
  "Wellness",
  "Baby Care",
  "Personal Care",
  "Medical Supplies",
]);

export function ProductsView() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const catParam = searchParams.get("cat") ?? "All";
  const activeCategory = (VALID_CATS.has(catParam) ? catParam : "All") as
    | ProductCategory
    | "All";

  useEffect(() => {
    track("page_view", { page: "products" });
  }, []);

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.products.eyebrow")}
        title={t("page.products.title")}
        description={t("page.products.desc")}
      />
      <CategoryShowcase
        active={activeCategory}
        onPick={(cat) => {
          track("shop_tab_click", { category: cat, source: "category-showcase" });
          // URL-driven filter state — replace (not push) to avoid history spam.
          router.replace(
            cat === "All" ? "/products" : `/products?cat=${encodeURIComponent(cat)}`,
            { scroll: false }
          );
          // Scroll to the catalogue so the filter change is visible.
          document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <section aria-label="Product catalogue" className="bg-background" id="catalogue">
        <div className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12 pb-20 sm:px-6 sm:py-16">
          <RecentProducts />
          {/* key remounts the catalogue when the showcase picks a category */}
          <ProductCatalogue
            key={activeCategory}
            initialCategory={activeCategory}
            showHeading={false}
          />
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
