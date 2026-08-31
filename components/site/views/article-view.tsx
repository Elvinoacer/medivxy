"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Clock, CalendarDays, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { ReadingProgress } from "@/components/site/reading-progress";
import { ShareButton } from "@/components/site/share-button";
import { OnThisPage, sectionId } from "@/components/site/on-this-page";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { CtaBand } from "@/components/site/cta-band";
import { getRelatedArticles } from "@/lib/data";
import { site, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";
import type { Article } from "@/lib/types";

/** Article detail (research.md §15): content, meta, related articles. */
export function ArticleView({ article }: { article: Article }) {
  const related = getRelatedArticles(article.slug, 2);

  useEffect(() => {
    track("article_view", { article: article.slug });
  }, [article.slug]);

  return (
    <main id="main-content">
      <ReadingProgress />
      <article className="bg-background">
        {/* Article hero */}
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Health Information", href: "/health-information" },
              { label: article.title },
            ]}
          />

          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {article.category}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {article.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <Clock aria-hidden="true" className="size-4" />
                  {article.readingTime} min read
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </span>
              </span>
              <ShareButton
                title={article.title}
                text={article.excerpt}
                url={`${site.url}/health-information/${article.slug}`}
                source="article"
              />
            </div>
          </Reveal>

          <Reveal delay={1} className="mt-8">
            <div className="overflow-hidden rounded-3xl shadow-lg ring-1 ring-border">
              <Image
                src={article.image}
                alt={article.imageAlt}
                width={1152}
                height={864}
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>

        {/* Body — sticky TOC beside the article on wide screens */}
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 xl:max-w-4xl">
          <div className="xl:grid xl:grid-cols-[200px_minmax(0,1fr)] xl:gap-12">
            <aside className="mb-8 xl:mb-0">
              <div className="rounded-2xl border bg-card/60 p-4 shadow-sm xl:sticky xl:top-24">
                <OnThisPage sections={article.content} />
              </div>
            </aside>

            <div className="min-w-0">
              <Reveal>
                <p className="border-l-4 border-primary/50 pl-5 font-display text-xl font-medium leading-8 text-foreground/90">
                  {article.excerpt}
                </p>
              </Reveal>

          <div className="mt-8 space-y-8">
            {article.content.map((section, i) => (
              <Reveal key={i} delay={Math.min(i, 4) as 0 | 1 | 2 | 3 | 4}>
                <section>
                  {section.heading && (
                    <h2
                      id={sectionId(section.heading)}
                      className="scroll-mt-24 font-display text-2xl font-semibold text-foreground"
                    >
                      {section.heading}
                    </h2>
                  )}
                  {section.paragraphs.map((p, j) => (
                    <p
                      key={j}
                      className="mt-4 text-base leading-8 text-foreground/80"
                    >
                      {p}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="mt-4 space-y-2.5">
                      {section.list.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 rounded-xl bg-white/70 p-3.5 text-sm leading-6 text-foreground/80 ring-1 ring-border/60"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </Reveal>
            ))}
          </div>

          {/* Disclaimer + CTA */}
          <Reveal className="mt-10">
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <p className="text-sm leading-7 text-foreground/75">
                This article is general information, not personal medical
                advice. For anything about your own medicines or symptoms,
                speak to the Medivyx pharmacist or your doctor.
              </p>
              <Button asChild className="mt-4 rounded-full">
                <a
                  href={whatsappLink(whatsappMessages.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp_click", { source: "article-cta" })}
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Ask the Pharmacist
                </a>
              </Button>
            </div>
          </Reveal>
            </div>
          </div>
        </div>
      </article>

      {/* Related */}
      <section aria-labelledby="related-articles" className="border-t bg-white/70">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <h2
            id="related-articles"
            className="font-display text-xl font-semibold text-foreground"
          >
            Related reading
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {related.map((rel) => (
              <li key={rel.slug}>
                <SiteLink
                  href={`/health-information/${rel.slug}`}
                  trackLabel="article-related"
                  className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-primary/20"
                >
                  <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-primary">
                    {rel.category}
                  </span>
                  <span className="mt-1.5 font-display text-base font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline">
                    {rel.title}
                  </span>
                  <span className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {rel.excerpt}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                    Read article
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </SiteLink>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
