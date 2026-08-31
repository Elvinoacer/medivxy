"use client";

import { useState } from "react";
import { X, Scale, ArrowRight, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductIcon } from "@/components/site/product-icon";
import { SiteLink } from "@/components/site/link";
import { formatAvailability } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

/**
 * Compare tray + dialog (new): pick up to 3 products from the catalogue
 * and line them up side by side. Prices are deliberately absent — the
 * demo catalogue is not a price list (research.md §9).
 */
export function ProductCompare({
  products,
  onRemove,
  onClear,
}: {
  products: Product[];
  onRemove: (slug: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (products.length === 0) return null;

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: "Category",
      render: (p) => p.category,
    },
    {
      label: "Availability",
      render: (p) => {
        const a = formatAvailability(p);
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              a.tone === "in" && "bg-mint text-mint-foreground",
              a.tone === "low" && "bg-honey-soft text-accent-foreground",
              a.tone === "ask" && "bg-secondary text-secondary-foreground"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 rounded-full",
                a.tone === "in" && "bg-emerald-600",
                a.tone === "low" && "bg-honey",
                a.tone === "ask" && "bg-muted-foreground/60"
              )}
            />
            {a.label}
          </span>
        );
      },
    },
    {
      label: "Prescription",
      render: (p) =>
        p.prescriptionRequired ? "Prescription required" : "Over the counter",
    },
    {
      label: "What it is",
      render: (p) => (
        <span className="block text-sm leading-6 text-muted-foreground">
          {p.description}
        </span>
      ),
    },
    {
      label: "How to use it",
      render: (p) => (
        <span className="block text-sm leading-6 text-muted-foreground">
          {p.usageInfo}
        </span>
      ),
    },
    {
      label: "",
      render: (p) => (
        <SiteLink
          href={`/products/${p.slug}`}
          trackLabel="compare-view-product"
          onClick={() => setOpen(false)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <Eye aria-hidden="true" className="size-4" />
          View product
        </SiteLink>
      ),
    },
  ];

  return (
    <>
      {/* Floating tray */}
      <div
        role="region"
        aria-label="Product comparison"
        className="no-print tray-up fixed inset-x-0 bottom-[72px] z-30 lg:bottom-4"
      >
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-xl shadow-foreground/10 backdrop-blur-md">
            <Scale
              aria-hidden="true"
              className="ml-1 size-5 shrink-0 text-primary"
            />
            <ul className="scrollbar-thin flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
              {products.map((p) => (
                <li
                  key={p.slug}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-secondary/70 py-1 pl-3 pr-1 text-xs font-medium text-secondary-foreground"
                >
                  <span className="max-w-36 truncate">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(p.slug)}
                    aria-label={`Remove ${p.name} from comparison`}
                    className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-secondary"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onClear}
              className="hidden min-h-9 items-center rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={products.length < 2}
              onClick={() => {
                setOpen(true);
                track("compare_open", { count: products.length });
              }}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-all",
                products.length < 2
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              )}
            >
              Compare
              <span className="rounded-full bg-black/15 px-1.5 text-xs font-bold">
                {products.length}
              </span>
              <span className="sr-only">
                {products.length < 2
                  ? "Select at least two products to compare"
                  : `Compare ${products.length} products`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Compare dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <Scale aria-hidden="true" className="size-5 text-primary" />
              Side-by-side comparison
            </DialogTitle>
            <DialogDescription>
              {products.length} products · availability and details side by
              side. Ask the team about anything marked “ask the team”.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 rounded-r-lg bg-gradient-to-l from-background to-transparent"
            />
            <p className="pb-2 text-[0.6875rem] text-muted-foreground sm:hidden">
              Swipe the table sideways to see every product →
            </p>
            <div className="scrollbar-thin overflow-x-auto px-5 py-4">
              <table className="w-full min-w-[560px] border-collapse text-left">
              <caption className="sr-only">
                Product comparison table
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="w-28 pb-4 pr-3 align-bottom">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Product
                    </span>
                  </th>
                  {products.map((p) => (
                    <th
                      key={p.slug}
                      scope="col"
                      className="min-w-44 pb-4 pr-3 align-bottom last:pr-0"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-secondary/50">
                          <ProductIcon
                            name={p.icon}
                            category={p.category}
                            className="size-5"
                          />
                        </span>
                        <span className="font-display text-sm font-semibold leading-tight text-foreground">
                          {p.name}
                          {p.prescriptionRequired && (
                            <span className="mt-1 block text-[0.5625rem] font-bold uppercase tracking-wide text-accent-foreground/80">
                              Rx · prescription
                            </span>
                          )}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label || "actions"} className="border-t">
                    <th
                      scope="row"
                      className="py-3 pr-3 text-xs font-semibold text-muted-foreground"
                    >
                      {row.label}
                    </th>
                    {products.map((p) => (
                      <td
                        key={p.slug}
                        className="py-3 pr-3 align-top text-sm text-foreground/85 last:pr-0"
                      >
                        {row.render(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          <p className="flex items-center gap-2 border-t bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
            <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
            Demo catalogue — the Medivyx team confirms stock and suitability
            in person.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
