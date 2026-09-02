import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { SiteLink } from "@/components/site/link";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { articles } from "@/lib/data";

/** Health Information preview (research.md §15). */
export function ArticlesSection({ limit = 3 }: { limit?: number }) {
  const list = articles.slice(0, limit);
  return (
    <section aria-labelledby="articles-heading" className="bg-card/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Health Information"
          titleId="articles-heading"
          title="Practical guidance from your pharmacy"
          description="Short, sensible reads that make everyday healthcare easier to understand."
        />

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {list.map((article, i) => (
            <Reveal as="li" key={article.slug} delay={(i % 3) as 0 | 1 | 2}>
              <SiteLink
                href={`/health-information/${article.slug}`}
                trackLabel="article-card"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-primary/20"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-primary backdrop-blur">
                    {article.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
                    {article.excerpt}
                  </p>
                  <p className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock aria-hidden="true" className="size-3.5" />
                      {article.readingTime} min read
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      Read
                      <ArrowRight
                        aria-hidden="true"
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </p>
                </div>
              </SiteLink>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={2} className="mt-8 text-center">
          <SiteLink
            href="/health-information"
            trackLabel="articles-all"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            All health articles
            <ArrowRight aria-hidden="true" className="size-4" />
          </SiteLink>
        </Reveal>
      </div>
    </section>
  );
}
