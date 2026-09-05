"use client";

import Image from "next/image";
import { toast } from "sonner";
import { ArrowRight, MessageCircle, Plus, Scale, ShieldCheck } from "lucide-react";
import { SiteLink } from "@/components/site/link";
import { useCart, formatKes } from "@/components/site/cart-provider";
import { StarRating } from "@/components/site/star-rating";
import { whatsappLink, whatsappMessages } from "@/lib/business";
import { formatAvailability } from "@/lib/data";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/site/language-provider";
import type { Product } from "@/lib/types";

const TONE_STYLES = {
  in: "bg-mint text-mint-foreground",
  low: "bg-honey-soft text-accent-foreground",
  ask: "bg-secondary text-secondary-foreground",
  out: "bg-destructive/10 text-destructive",
} as const;

export interface ProductCardCompareProps {
  /** Set when the catalogue offers side-by-side comparison. */
  selected: boolean;
  onToggle: () => void;
  /** True when the compare limit is reached and this card isn't selected. */
  disabled?: boolean;
}

/** Product card — photo, price, availability + Add-to-basket. Rx items route
 *  through the prescription-aware checkout flow. */
export function ProductCard({
  product,
  compare,
  eager = false,
  rating,
  stock,
}: {
  product: Product;
  compare?: ProductCardCompareProps;
  /** Marks above-the-fold cards so their photo loads eagerly (LCP). */
  eager?: boolean;
  /** Average rating + review count from the reviews store (optional). */
  rating?: { avg: number; count: number };
  /** Live stock level (from /api/stock) — 0 disables Add-to-basket. */
  stock?: number;
}) {
  const availability = formatAvailability(product, stock);
  const isRx = product.prescriptionRequired;
  const outOfStock = stock === 0;
  const { addToCart, openCart } = useCart();
  const { t } = useLanguage();

  function handleAdd() {
    if (outOfStock) return;
    addToCart(product, 1);
    track("add_to_cart", { product: product.slug, source: "product-card" });
    toast(t("shop.added"), {
      description: product.name,
      action: {
        label: t("shop.viewBasket"),
        onClick: openCart,
      },
    });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/8 hover:ring-1 hover:ring-primary/25">
      {/* Photo */}
      <SiteLink
        href={`/products/${product.slug}`}
        trackLabel="product-card"
        ariaLabel={`View details for ${product.name} — ${formatKes(product.price)}`}
        className="relative block aspect-[5/4] overflow-hidden bg-secondary/50"
      >
        <Image
          src={product.image}
          alt={`${product.name} — ${product.tagline.toLowerCase()}`}
          fill
          priority={eager}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-foreground/10 via-transparent to-transparent"
        />
        <span
          className={cn(
            "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold shadow-sm backdrop-blur",
            TONE_STYLES[availability.tone]
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              availability.tone === "in" && "bg-emerald-600",
              availability.tone === "low" && "bg-honey",
              availability.tone === "ask" && "bg-muted-foreground/60",
              availability.tone === "out" && "bg-destructive"
            )}
          />
          {availability.label}
        </span>
        {isRx && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-foreground/85 px-2.5 py-1 text-[0.6875rem] font-semibold text-background shadow-sm backdrop-blur">
            <ShieldCheck aria-hidden="true" className="size-3" />
            Rx
          </span>
        )}
      </SiteLink>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <SiteLink href={`/products/${product.slug}`} trackLabel="product-card-name" className="block">
          <h3 className="font-display text-base font-semibold leading-snug text-foreground underline-offset-4 group-hover:underline sm:text-lg">
            {product.name}
          </h3>
        </SiteLink>
        {rating && rating.count > 0 ? (
          <SiteLink
            href={`/products/${product.slug}#reviews-heading`}
            trackLabel="product-card-rating"
            className="mt-1 inline-flex rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            ariaLabel={`Reviews for ${product.name} — ${rating.avg.toFixed(1)} out of 5 from ${rating.count} reviews`}
          >
            <StarRating value={rating.avg} count={rating.count} />
          </SiteLink>
        ) : null}
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.tagline}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{product.packSize}</p>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="font-display text-lg font-bold text-foreground">
            {formatKes(product.price)}
          </p>
          {compare ? (
            <button
              type="button"
              onClick={compare.onToggle}
              aria-pressed={compare.selected}
              aria-label={`${compare.selected ? "Remove" : "Add"} ${product.name} ${compare.selected ? "from" : "to"} comparison`}
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                compare.selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-secondary hover:text-primary",
                compare.disabled && !compare.selected && "cursor-not-allowed opacity-50"
              )}
            >
              <Scale aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>

        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{t("shop.priceNote")}</p>

        {isRx && (
          <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-honey/40 bg-honey-soft/40 px-2.5 py-1 text-[0.6875rem] font-semibold text-accent-foreground">
            <ShieldCheck aria-hidden="true" className="size-3" />
            Prescription reviewed at checkout
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-disabled={outOfStock}
            title={outOfStock ? "Out of stock — ask the team when it returns" : undefined}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              outOfStock && "cursor-not-allowed bg-muted text-muted-foreground shadow-none hover:bg-muted"
            )}
            aria-label={`Add ${product.name} to basket — ${formatKes(product.price)}`}
          >
            <Plus aria-hidden="true" className="size-4" />
            {outOfStock ? "Out of stock" : t("shop.addToCart")}
          </button>
          <a
            href={whatsappLink(whatsappMessages.product(product.name))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { source: "product-card", product: product.slug })}
            className="wa-cta inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm active:scale-[0.98]"
            aria-label={`Ask about ${product.name} on WhatsApp`}
            title={isRx ? "Ask the pharmacist" : "Ask about availability"}
          >
            <MessageCircle aria-hidden="true" className="size-4" />
          </a>
          <SiteLink
            href={`/products/${product.slug}`}
            trackLabel="product-card-details"
            ariaLabel={`View details for ${product.name}`}
            className="hidden size-11 shrink-0 items-center justify-center rounded-full border text-foreground/70 transition-colors hover:bg-secondary hover:text-primary sm:flex"
          >
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </SiteLink>
        </div>
      </div>
    </article>
  );
}
