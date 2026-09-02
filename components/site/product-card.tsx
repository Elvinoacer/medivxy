"use client";

import { ArrowRight, MessageCircle, Scale } from "lucide-react";
import { ProductIcon } from "@/components/site/product-icon";
import { SiteLink } from "@/components/site/link";
import { whatsappLink, whatsappMessages } from "@/lib/business";
import { formatAvailability } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

const TONE_STYLES = {
  in: "bg-mint text-mint-foreground",
  low: "bg-honey-soft text-accent-foreground",
  ask: "bg-secondary text-secondary-foreground",
} as const;

export interface ProductCardCompareProps {
  /** Set when the catalogue offers side-by-side comparison. */
  selected: boolean;
  onToggle: () => void;
  /** True when the compare limit is reached and this card isn't selected. */
  disabled?: boolean;
}

/** Product card (research.md §9) — availability indicator + Ask CTA. */
export function ProductCard({
  product,
  compare,
}: {
  product: Product;
  compare?: ProductCardCompareProps;
}) {
  const availability = formatAvailability(product);
  const isRx = product.prescriptionRequired;

  return (
    <article className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/8 hover:ring-1 hover:ring-primary/25">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-block transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
          <ProductIcon name={product.icon} category={product.category} />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold",
            TONE_STYLES[availability.tone]
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              availability.tone === "in" && "bg-emerald-600",
              availability.tone === "low" && "bg-honey",
              availability.tone === "ask" && "bg-muted-foreground/60"
            )}
          />
          {availability.label}
        </span>
      </div>

      <SiteLink
        href={`/products/${product.slug}`}
        trackLabel="product-card"
        className="mt-4 block"
      >
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline">
          {product.name}
        </h3>
      </SiteLink>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {product.category} · {product.tagline}
      </p>
      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
        {product.description}
      </p>

      {isRx && (
        <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-honey/40 bg-honey-soft/40 px-2.5 py-1 text-[0.6875rem] font-semibold text-accent-foreground">
          <MessageCircle aria-hidden="true" className="size-3" />
          Prescription Required
        </p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <a
          href={whatsappLink(whatsappMessages.product(product.name))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp_click", { source: "product-card", product: product.slug })}
          className="wa-cta inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm active:scale-[0.98]"
          aria-label={`Ask about availability of ${product.name} on WhatsApp`}
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          {isRx ? "Ask Pharmacist" : "Ask About Availability"}
        </a>
        {compare ? (
          <button
            type="button"
            onClick={compare.onToggle}
            aria-pressed={compare.selected}
            aria-label={`${compare.selected ? "Remove" : "Add"} ${product.name} ${compare.selected ? "from" : "to"} comparison`}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
              compare.selected
                ? "border-primary bg-primary text-primary-foreground"
                : "text-foreground/70 hover:bg-secondary hover:text-primary",
              compare.disabled && !compare.selected && "cursor-not-allowed opacity-50"
            )}
          >
            <Scale aria-hidden="true" className="size-4" />
          </button>
        ) : null}
        <SiteLink
          href={`/products/${product.slug}`}
          trackLabel="product-card-details"
          ariaLabel={`View details for ${product.name}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border text-foreground/70 transition-colors hover:bg-secondary hover:text-primary"
        >
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </SiteLink>
      </div>
    </article>
  );
}
