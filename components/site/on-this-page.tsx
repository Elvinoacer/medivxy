"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleSection } from "@/lib/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Stable DOM id for an article section heading. */
export function sectionId(heading: string): string {
  return slugify(heading);
}

/**
 * On-this-page table of contents for health articles, with
 * scroll-spy highlight. Headings are given stable ids by
 * the article view; this component only observes them.
 */
export function OnThisPage({ sections }: { sections: ArticleSection[] }) {
  const headings = useMemo(
    () =>
      sections
        .map((s, i) => (s.heading ? { id: slugify(s.heading), text: s.heading, index: i } : null))
        .filter((h): h is { id: string; text: string; index: number } => Boolean(h)),
    [sections]
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    // Highlight the first heading already in view; else the first.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );
    observerRef.current = observer;
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-labelledby="on-this-page-heading" className="text-sm">
      <p
        id="on-this-page-heading"
        className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        <ListTree aria-hidden="true" className="size-3.5" />
        On this page
      </p>
      <ul className="mt-3 space-y-1 border-l border-border/70">
        {headings.map((h) => {
          const active = activeId === h.id;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                aria-current={active ? "location" : undefined}
                onClick={(e) => {
                  // Controlled scroll: keeps the hash router (preview build)
                  // untouched — a bare "#id" would be parsed as a route.
                  e.preventDefault();
                  document
                    .getElementById(h.id)
                    ?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                }}
                className={cn(
                  "relative block rounded-sm py-1.5 pl-4 pr-2 leading-5 transition-colors",
                  active
                    ? "font-medium text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
