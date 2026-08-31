"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Clock, CalendarDays } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta-band";
import { articles } from "@/lib/data";
import { track } from "@/lib/analytics";

/** Health Information listing (research.md §15). */
export function ArticlesView() {
  const { t } = useLanguage();
  useEffect(() => {
    track("page_view", { page: "health-information" });
  }, []);

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.articles.eyebrow")}
        title={t("page.articles.title")}
        description={t("page.articles.desc")}
      />
      <section aria-label="All health articles" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 pb-20 sm:px-6 sm:py-16">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <Reveal as="li" key={article.slug} delay={(i % 3) as 0 | 1 | 2}>
                <SiteLink
                  href={`/health-information/${article.slug}`}
                  trackLabel="article-card-list"
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-primary/20"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={article.image}
                      alt={article.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-primary backdrop-blur">
                      {article.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-lg font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline">
                      {article.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                      {article.excerpt}
                    </p>
                    <p className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock aria-hidden="true" className="size-3.5" />
                          {article.readingTime} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays aria-hidden="true" className="size-3.5" />
                          <time dateTime={article.publishedAt}>
                            {new Date(article.publishedAt).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </time>
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 text-primary transition-transform group-hover:translate-x-0.5"
                      />
                    </p>
                  </div>
                </SiteLink>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
