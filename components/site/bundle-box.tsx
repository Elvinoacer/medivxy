"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, PackagePlus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart, formatKes } from "@/components/site/cart-provider";
import { useLanguage } from "@/components/site/language-provider";
import { track } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * "Complete your kit" — frequently-bought-together bundle box on the product
 * page. The current product is always included; companions can be toggled
 * before a single-tap "add all to basket".
 */
export function BundleBox({
  product,
  companions,
}: {
  product: Product;
  companions: Product[];
}) {
  const { t } = useLanguage();
  const { addToCart, openCart } = useCart();
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(companions.map((c) => [c.slug, true]))
  );

  const chosen = useMemo(
    () => companions.filter((c) => selected[c.slug]),
    [companions, selected]
  );
  const total = product.price + chosen.reduce((s, c) => s + c.price, 0);
  const itemCount = 1 + chosen.length;

  function toggle(slug: string) {
    setSelected((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  function addBundle() {
    addToCart(product, 1);
    for (const c of chosen) addToCart(c, 1);
    track("add_to_cart", {
      product: product.slug,
      source: "bundle",
      items: itemCount,
    });
    toast.success(t("shop.added"), {
      description: `${itemCount} item${itemCount === 1 ? "" : "s"} added — review them in your basket.`,
      action: { label: t("shop.viewBasket"), onClick: openCart },
    });
  }

  return (
    <section
      aria-labelledby="bundle-heading"
      className="no-print mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <div className="flex items-center gap-2.5 border-b bg-secondary/40 px-4 py-3 sm:px-5">
        <PackagePlus aria-hidden="true" className="size-4.5 shrink-0 text-primary" />
        <h2
          id="bundle-heading"
          className="text-sm font-semibold text-foreground"
        >
          Complete your kit
        </h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
          often bought together
        </span>
      </div>

      <div className="p-4 sm:p-5">
        {/* Thumbnail strip: current product + companions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <BundleThumb product={product} label="This item" />
          {companions.map((c) => (
            <div key={c.slug} className="contents">
              <Plus
                aria-hidden="true"
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  selected[c.slug] ? "text-primary" : "text-muted-foreground/40"
                )}
              />
              <BundleThumb
                product={c}
                label={c.name}
                dimmed={!selected[c.slug]}
                onClick={() => toggle(c.slug)}
              />
            </div>
          ))}
        </div>

        {/* Companion rows (toggleable) */}
        <ul className="mt-4 space-y-1.5">
          <li className="flex items-center gap-3 rounded-xl bg-secondary/30 px-3 py-2">
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {product.name}
            </span>
            <span className="text-sm font-semibold text-foreground">
              {formatKes(product.price)}
            </span>
          </li>
          {companions.map((c) => {
            const isSelected = selected[c.slug];
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => toggle(c.slug)}
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-label={`Include ${c.name} in the kit`}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    isSelected
                      ? "bg-secondary/30 hover:bg-secondary/50"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/40 text-transparent"
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {c.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {c.packSize}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    +{formatKes(c.price)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Kit total for{" "}
            <span className="font-semibold text-foreground">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
            <span className="ml-2 font-display text-base font-bold text-foreground">
              {formatKes(total)}
            </span>
          </p>
          <Button
            onClick={addBundle}
            disabled={itemCount < 2}
            className="rounded-full px-6 shadow-md shadow-primary/20"
            aria-label={
              itemCount < 2
                ? "Select a companion item to build a kit"
                : `Add ${itemCount} items to basket`
            }
          >
            <ShoppingBag aria-hidden="true" className="size-4.5" />
            {itemCount < 2 ? "Pick a companion" : "Add kit to basket"}
          </Button>
        </div>
      </div>
    </section>
  );
}

function BundleThumb({
  product,
  label,
  dimmed = false,
  onClick,
}: {
  product: Product;
  label: string;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  const img = (
    <span className="relative block size-16 overflow-hidden rounded-xl border bg-secondary/40 sm:size-20">
      <Image
        src={product.image}
        alt=""
        fill
        sizes="80px"
        className={cn(
          "object-cover transition-all",
          dimmed && "opacity-40 grayscale-[30%]"
        )}
      />
    </span>
  );
  if (!onClick) {
    return (
      <span className="flex flex-col items-center gap-1.5" title={label}>
        {img}
        <span className="max-w-20 truncate text-[0.625rem] font-medium text-muted-foreground">
          {label}
        </span>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Toggle ${label}`}
      className="flex flex-col items-center gap-1.5 rounded-xl p-1 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {img}
      <span className="max-w-20 truncate text-[0.625rem] font-medium text-muted-foreground">
        {label}
      </span>
    </button>
  );
}
