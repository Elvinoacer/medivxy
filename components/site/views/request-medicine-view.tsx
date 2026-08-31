"use client";

import { useEffect } from "react";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { RequestMedicineForm } from "@/components/site/request-medicine-form";
import { FaqSection } from "@/components/site/faq-section";
import { track } from "@/lib/analytics";

/** Request Medicine page (research.md §8). */
export function RequestMedicineView() {
  const { t } = useLanguage();
  useEffect(() => {
    track("page_view", { page: "request-medicine" });
  }, []);

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.request.eyebrow")}
        title={t("page.request.title")}
        description={t("page.request.desc")}
      />
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 pb-20 sm:px-6 sm:py-16">
          <RequestMedicineForm />
        </div>
      </section>
      <FaqSection compact />
    </main>
  );
}
