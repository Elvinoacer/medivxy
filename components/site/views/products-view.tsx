"use client";

import { useEffect } from "react";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { ProductCatalogue } from "@/components/site/product-catalogue";
import { RecentProducts } from "@/components/site/recent-products";
import { CtaBand } from "@/components/site/cta-band";
import { track } from "@/lib/analytics";

export function ProductsView() {
  const { t } = useLanguage();
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
      <section aria-label="Product catalogue" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 pb-20 sm:px-6 sm:py-16">
          <RecentProducts />
          <ProductCatalogue showHeading={false} />
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
