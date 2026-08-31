"use client";

import { useEffect } from "react";
import { Hero } from "@/components/site/hero";
import { TrustBar } from "@/components/site/trust-bar";
import { QuickHelp } from "@/components/site/quick-help";
import { FindWhatYouNeed } from "@/components/site/find-what-you-need";
import { ServicesSection } from "@/components/site/services-section";
import { FeaturedProducts } from "@/components/site/featured-products";
import { StatsBand } from "@/components/site/stats-band";
import { WhyMedivyx } from "@/components/site/why-medivyx";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { ArticlesSection } from "@/components/site/articles-section";
import { FaqSection } from "@/components/site/faq-section";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/site/section-heading";
import { LocationCard } from "@/components/site/location-card";
import { Reveal } from "@/components/site/reveal";
import { useLanguage } from "@/components/site/language-provider";
import { track } from "@/lib/analytics";

export function HomeView() {
  const { t } = useLanguage();

  useEffect(() => {
    track("page_view", { page: "home" });
  }, []);

  return (
    <main id="main-content">
      <Hero />
      <TrustBar />
      <QuickHelp />
      <FindWhatYouNeed />
      <ServicesSection />
      <FeaturedProducts />
      <StatsBand />
      <WhyMedivyx />
      <TestimonialsSection />
      <ArticlesSection />
      <FaqSection compact />
      <section aria-labelledby="visit-heading" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow={t("home.visitEyebrow")}
            titleId="visit-heading"
            title={t("home.visitTitle")}
            description={t("home.visitDesc")}
          />
          <div className="mx-auto mt-10 max-w-2xl">
            <LocationCard />
          </div>
        </div>
      </section>
      <CtaBand />
      <Reveal className="sr-only">
        Medivyx Medical Care — pharmacy and healthcare in Roysambu, Nairobi
      </Reveal>
    </main>
  );
}
