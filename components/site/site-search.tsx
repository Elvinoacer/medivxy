"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Pill,
  HandHeart,
  Newspaper,
  Sparkles,
  Package,
  ArrowRight,
  MessageCircle,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Clock,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiteLink } from "@/components/site/link";
import { searchAll, type SearchResults } from "@/lib/search";
import { whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types";

interface SearchGroup {
  key: keyof SearchResults;
  label: string;
  icon: typeof Pill;
}

/** Result groups in display order (keys match SearchResults). */
const GROUPS: SearchGroup[] = [
  { key: "actions", label: "Quick actions", icon: Package },
  { key: "products", label: "Products", icon: Pill },
  { key: "articles", label: "Health articles", icon: Newspaper },
  { key: "services", label: "Services", icon: HandHeart },
  { key: "faqs", label: "FAQs", icon: Sparkles },
];

/** With a query, real matches come before fallback actions. */
const QUERY_GROUPS: SearchGroup[] = [
  { key: "products", label: "Products", icon: Pill },
  { key: "articles", label: "Health articles", icon: Newspaper },
  { key: "services", label: "Services", icon: HandHeart },
  { key: "faqs", label: "FAQs", icon: Sparkles },
  { key: "actions", label: "Quick actions", icon: Package },
];

function flatten(results: SearchResults, groups: SearchGroup[]): SearchResult[] {
  return groups.flatMap((g) => results[g.key]);
}

/**
 * Global ⌘K search dialog — searches products, articles, services and FAQs
 * from the shared catalogue data, with full keyboard navigation and
 * recent-search recall (localStorage, max 5).
 */

const RECENT_KEY = "medivyx:recent-searches";
const RECENT_MAX = 5;

function loadRecent(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as unknown;
    return Array.isArray(raw)
      ? raw.filter((v): v is string => typeof v === "string").slice(0, RECENT_MAX)
      : [];
  } catch {
    return [];
  }
}

function persistRecent(list: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — recents just won't persist
  }
}

export function SiteSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fresh query + recall recent searches whenever the dialog opens.
  useEffect(() => {
    if (open) {
      const reset = () => {
        setQuery("");
        setActiveIndex(0);
        setRecent(loadRecent());
      };
      reset();
      // Focus after the dialog mounts.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const rememberQuery = useCallback((raw: string) => {
    const q = raw.trim().slice(0, 60);
    if (q.length < 2) return;
    setRecent((prev) => {
      const next = [q, ...prev.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_MAX);
      persistRecent(next);
      return next;
    });
  }, []);

  const results = useMemo(() => searchAll(query, 6), [query]);
  const hasQuery = query.trim().length > 0;
  const groups = hasQuery ? QUERY_GROUPS : GROUPS;
  const flat = useMemo(() => flatten(results, groups), [results, groups]);
  const total = flat.length;

  // Clamp the highlight when the result set shrinks — avoids a reset effect.
  const active = total > 0 ? Math.min(activeIndex, total - 1) : 0;

  // Keep the active item in view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const openActive = useCallback(() => {
    // Click the rendered SiteLink anchor for the active item — the
    // navigation adapter (hash router / next Link) handles the route.
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`
    );
    const anchor = el?.closest("a");
    anchor?.click();
  }, [active]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (total > 0) setActiveIndex((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (total > 0) setActiveIndex((i) => (i - 1 + total) % total);
    } else if (e.key === "Enter") {
      const item = flat[active];
      if (item) {
        e.preventDefault();
        track("search", { query: query.slice(0, 60), source: "command-palette" });
        rememberQuery(query);
        onOpenChange(false);
        openActive();
      }
    }
  }

  // Track palette usage (opened, navigated).
  useEffect(() => {
    if (open) track("search_open", { source: "command-palette" });
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[10%] max-w-xl translate-y-0 gap-0 overflow-hidden rounded-2xl border-border/70 bg-background p-0 shadow-2xl sm:max-w-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onOpenChange(false);
        }}
      >
        <DialogTitle className="sr-only">Search the Medivyx site</DialogTitle>
        <DialogDescription className="sr-only">
          Search products, health articles, services and quick actions.
        </DialogDescription>

        {/* Input */}
        <div className="flex items-center gap-3 border-b px-4 py-3.5">
          <Search
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="site-search-results"
            aria-autocomplete="list"
            aria-activedescendant={total > 0 ? `search-item-${active}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search products, articles, services…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
          />
          <span className="kbd-chip hidden sm:inline-flex">esc</span>
        </div>

        {/* Recent searches (empty query only) */}
        {!hasQuery && recent.length > 0 && (
          <div className="border-b bg-muted/25 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                <Clock aria-hidden="true" className="size-3" />
                Recent searches
              </p>
              <button
                type="button"
                onClick={() => {
                  setRecent([]);
                  persistRecent([]);
                }}
                className="flex min-h-8 items-center gap-1 rounded-full px-2 text-[0.6875rem] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X aria-hidden="true" className="size-3" />
                Clear
              </button>
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {recent.map((q) => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(q);
                      setActiveIndex(0);
                      inputRef.current?.focus();
                    }}
                    className="flex max-w-56 min-h-9 items-center gap-1.5 truncate rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-foreground/85 transition-all duration-200 hover:border-primary/40 hover:bg-mint/30 active:scale-[0.96]"
                  >
                    <Clock aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{q}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Results */}
        <div
          ref={listRef}
          id="site-search-results"
          role="listbox"
          aria-label="Search results"
          className="scrollbar-thin max-h-[min(60vh,480px)] overflow-y-auto p-2"
        >
          {total === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No matches for “{query.trim()}”
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Many items are not listed online — the team will happily check
                for you.
              </p>
              <a
                href={whatsappLink(whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track("whatsapp_click", { source: "search-empty" });
                  onOpenChange(false);
                }}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1faa53] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#199047]"
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                Ask on WhatsApp
              </a>
            </div>
          ) : (
            groups.map(({ key, label, icon: Icon }) => {
              const group = results[key];
              if (group.length === 0) return null;
              return (
                <div key={key} role="group" aria-label={label}>
                  <p className="px-3 pt-3 pb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {hasQuery ? label : `Suggested · ${label}`}
                  </p>
                  <ul>
                    {group.map((r) => {
                      const index = flat.indexOf(r);
                      const isActive = index === active;
                      return (
                        <li key={`${r.kind}-${r.href}-${r.title}`} role="none">
                          <SiteLink
                            href={r.href}
                            trackLabel="palette-result"
                            ariaLabel={`Go to ${r.title}`}
                            onClick={() => {
                              if (hasQuery) rememberQuery(query);
                              onOpenChange(false);
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                              isActive
                                ? "bg-primary/10 text-foreground"
                                : "text-foreground/85 hover:bg-secondary/60"
                            )}
                            style={{ display: "flex" }}
                          >
                            <span
                              role="option"
                              aria-selected={isActive}
                              id={`search-item-${index}`}
                              data-index={index}
                              className="flex min-w-0 flex-1 items-center gap-3"
                            >
                              <span
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                  isActive
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "bg-muted/60 text-muted-foreground"
                                )}
                              >
                                <Icon aria-hidden="true" className="size-4.5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="truncate text-sm font-semibold">
                                    {r.title}
                                  </span>
                                  {r.prescriptionRequired && (
                                    <span className="shrink-0 rounded-full bg-honey-soft/50 px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-accent-foreground">
                                      Rx
                                    </span>
                                  )}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {r.subtitle}
                                </span>
                              </span>
                            </span>
                            {isActive && (
                              <CornerDownLeft
                                aria-hidden="true"
                                className="size-4 shrink-0 text-primary"
                              />
                            )}
                          </SiteLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between gap-3 border-t bg-muted/40 px-4 py-2.5 text-[0.6875rem] text-muted-foreground">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="kbd-chip">
                <ArrowUp aria-hidden="true" className="size-3" />
                <ArrowDown aria-hidden="true" className="size-3" />
              </span>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="kbd-chip">↵</span>
              open
            </span>
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <ArrowRight aria-hidden="true" className="size-3" />
            Search by Medivyx
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
