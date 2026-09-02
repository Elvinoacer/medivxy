"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ArrowRight,
  Pill,
  HandHeart,
  Package,
  Newspaper,
  Sparkles,
  FileWarning,
} from "lucide-react";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { searchAll } from "@/lib/search";
import { track } from "@/lib/analytics";

const EXAMPLES = [
  "Paracetamol",
  "Baby care",
  "First aid",
  "Prescription",
  "Vitamins",
  "Thermometer",
];

/**
 * "Find What You Need" (research.md §7) — the demo's moment to shine
 * beyond a brochure site. Categorised results; prescription items are
 * clearly flagged and never "purchasable".
 */
export function FindWhatYouNeed() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const results = useMemo(
    () => (submitted ? searchAll(submitted, 6) : null),
    [submitted]
  );
  const total =
    results &&
    results.products.length +
      results.services.length +
      results.articles.length +
      results.faqs.length +
      results.actions.length;

  function submit(q: string) {
    const value = q.trim();
    setQuery(value);
    setSubmitted(value);
    if (value) track("search", { query: value.slice(0, 80) });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") submit(query);
  }

  return (
    <section
      aria-labelledby="find-heading"
      className="border-y bg-foreground text-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <Reveal>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-background/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-background/80">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Search
            </p>
            <h2
              id="find-heading"
              className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              What are you looking for?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-background/70">
              Search medicines, healthcare products and services — then ask
              the team about anything you need.
            </p>
          </Reveal>
        </div>

        <Reveal delay={1}>
          <div className="mx-auto mt-8 max-w-2xl">
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                submit(query);
              }}
              className="flex items-center gap-2 rounded-full bg-background p-2 shadow-xl shadow-black/20"
            >
              <label htmlFor="site-search" className="sr-only">
                Search medicines, healthcare products and services
              </label>
              <Search
                aria-hidden="true"
                className="ml-3 size-5 shrink-0 text-muted-foreground"
              />
              <input
                id="site-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search medicines, healthcare products…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
                type="search"
                autoComplete="off"
              />
              <button
                type="submit"
                className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
              >
                Search
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-background/50">Try:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => submit(ex)}
                  className="rounded-full border border-background/20 bg-background/5 px-3.5 py-1.5 text-xs font-medium text-background/80 transition-colors hover:bg-background/15"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {results && (
          <div className="mx-auto mt-10 max-w-3xl">
            {total === 0 ? (
              <div className="rounded-2xl border border-background/15 bg-background/5 p-6 text-center">
                <p className="flex items-center justify-center gap-2 text-sm text-background/80">
                  <FileWarning aria-hidden="true" className="size-4" />
                  No matches for “{submitted}”.
                </p>
                <p className="mt-2 text-sm text-background/60">
                  The team can still check for you — many items are not
                  listed online.
                </p>
                <SiteLink
                  href="/request-medicine"
                  trackLabel="search-request-instead"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
                  style={{ color: "oklch(0.9 0.1 160)" }}
                >
                  Request it instead
                  <ArrowRight aria-hidden="true" className="size-4" />
                </SiteLink>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {[...results.products, ...results.services, ...results.articles, ...results.faqs, ...results.actions].map(
                  (r) => (
                    <li key={`${r.kind}-${r.title}`}>
                      <SiteLink
                        href={r.href}
                        trackLabel="search-result"
                        className="group flex items-center gap-4 rounded-2xl border border-background/15 bg-background/5 p-4 transition-colors hover:border-background/30 hover:bg-background/10"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/10 text-background/80">
                          {r.kind === "product" ? (
                            <Pill aria-hidden="true" className="size-5" />
                          ) : r.kind === "service" ? (
                            <HandHeart aria-hidden="true" className="size-5" />
                          ) : r.kind === "article" ? (
                            <Newspaper aria-hidden="true" className="size-5" />
                          ) : r.kind === "faq" ? (
                            <Sparkles aria-hidden="true" className="size-5" />
                          ) : (
                            <Package aria-hidden="true" className="size-5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-background">
                              {r.title}
                            </span>
                            {r.prescriptionRequired && (
                              <span className="inline-flex items-center rounded-full bg-honey-soft/30 px-2 py-0.5 text-[0.625rem] font-semibold text-honey-soft">
                                Prescription Required
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-background/60">
                            {r.subtitle}
                          </span>
                        </span>
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-background/40 transition-transform group-hover:translate-x-0.5"
                        />
                      </SiteLink>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
