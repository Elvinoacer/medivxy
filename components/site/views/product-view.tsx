"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MessageCircle,
  Minus,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  Info,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/site/product-card";
import { ProductReviews } from "@/components/site/product-reviews";
import { ProductQuestions } from "@/components/site/product-questions";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { recordRecentProduct } from "@/components/site/recent-products";
import { ShareButton } from "@/components/site/share-button";
import { Reveal } from "@/components/site/reveal";
import { useCart, formatKes } from "@/components/site/cart-provider";
import { useLanguage } from "@/components/site/language-provider";
import { business, site, whatsappLink, whatsappMessages } from "@/lib/business";
import { formatAvailability, products } from "@/lib/data";
import { BundleBox } from "@/components/site/bundle-box";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

const TONE_STYLES = {
  in: "bg-mint text-mint-foreground",
  low: "bg-honey-soft text-accent-foreground",
  ask: "bg-secondary text-secondary-foreground",
  out: "bg-destructive/10 text-destructive",
} as const;

/** Product detail page (research.md §10). Print-friendly: CTAs and related
 *  products are dropped on paper, and a URL/date footer is added instead. */
export function ProductView({ product }: { product: Product }) {
  const { t } = useLanguage();
  const router = useRouter();
  const { addToCart, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  // Live stock level (null until /api/stock answers; 0 = out of stock).
  const [stock, setStock] = useState<number | null>(null);
  // Date stamp for the print footer (lazy — computed once, never during render).
  const [printedOn] = useState(() =>
    new Date().toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );
  const availability = formatAvailability(product, stock ?? undefined);
  const related = products
    .filter((p) => p.slug !== product.slug && p.category === product.category)
    .slice(0, 3);
  // Bundle companions: same category, no Rx where possible (keeps the kit
  // one-tap friendly — Rx items still work, they just add the review step).
  const bundleCompanions = products
    .filter(
      (p) =>
        p.slug !== product.slug &&
        p.category === product.category &&
        !p.prescriptionRequired
    )
    .slice(0, 2);
  const outOfStock = stock === 0;

  // Live stock for this product (from the staff-managed store).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/stock");
        const data = await res.json().catch(() => ({}));
        if (active && res.ok && data.levels && typeof data.levels[product.slug] === "number") {
          setStock(data.levels[product.slug]);
        }
      } catch {
        // static catalogue availability still applies
      }
    })();
    return () => {
      active = false;
    };
  }, [product.slug]);

  useEffect(() => {
    track("product_view", { product: product.slug });
    recordRecentProduct(product.slug);
  }, [product.slug]);

  function handleAdd(goCheckout = false) {
    if (outOfStock) {
      toast.error("Out of stock", {
        description: "Ask the team on WhatsApp — restock dates are confirmed there.",
      });
      return;
    }
    addToCart(product, quantity);
    track("add_to_cart", { product: product.slug, quantity, source: "product-detail" });
    toast(t("shop.added"), {
      description: `${product.name} × ${quantity}`,
      action: { label: t("shop.viewBasket"), onClick: openCart },
    });
    if (goCheckout) router.push("/checkout");
  }

  return (
    <main id="main-content">
      <div className="mx-auto max-w-6xl px-4 py-8 pb-20 sm:px-6 sm:py-12">
        {/* Breadcrumb wayfinding */}
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: product.name },
          ]}
        />

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          {/* Visual panel */}
          <Reveal className="min-w-0">
            <div className="product-print-block sticky top-28">
              <div className="relative overflow-hidden rounded-3xl border bg-card shadow-sm">
                <div className="relative aspect-square w-full bg-secondary/50">
                  <Image
                    src={product.image}
                    alt={`${product.name} — ${product.tagline.toLowerCase()}`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm backdrop-blur",
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
                  {product.prescriptionRequired && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-sm">
                      <ShieldCheck aria-hidden="true" className="size-3.5" />
                      Prescription Required
                    </span>
                  )}
                </div>
              </div>
              <p className="no-print mt-3 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                <Info aria-hidden="true" className="size-3.5" />
                Demo catalogue photo — availability confirmed by the team
              </p>
            </div>
          </Reveal>

          {/* Info panel */}
          <Reveal delay={1} className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {product.category}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{product.tagline}</p>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-display text-3xl font-bold text-foreground">
                {formatKes(product.price)}
              </p>
              <p className="text-sm text-muted-foreground">{product.packSize}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("shop.priceNote")}</p>

            {/* Buy box */}
            <div className="no-print mt-6 rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-full border">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex size-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
                  >
                    <Minus aria-hidden="true" className="size-4" />
                  </button>
                  <span aria-live="polite" className="w-10 text-center text-base font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    aria-label="Increase quantity"
                    className="flex size-11 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total <span className="font-semibold text-foreground">{formatKes(product.price * quantity)}</span>
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1 rounded-full px-6 shadow-md shadow-primary/20"
                  onClick={() => handleAdd(false)}
                  disabled={outOfStock}
                >
                  <ShoppingBag aria-hidden="true" className="size-4.5" />
                  {outOfStock ? "Out of stock" : t("shop.addToCart")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 rounded-full px-6"
                  onClick={() => handleAdd(true)}
                  disabled={outOfStock}
                >
                  Buy now
                  <ArrowRight aria-hidden="true" className="size-4.5" />
                </Button>
              </div>
              <ul className="mt-4 grid gap-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Store aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                  Pick up today in Roysambu — typically ready in 1–2 hours
                </li>
                <li className="flex items-center gap-2">
                  <Truck aria-hidden="true" className="size-3.5 shrink-0 text-primary" />
                  Same-day delivery around Nairobi (fee confirmed before dispatch)
                </li>
                {typeof stock === "number" && stock > 0 && stock <= 5 && (
                  <li className="flex items-center gap-2 font-medium text-accent-foreground">
                    <Package aria-hidden="true" className="size-3.5 shrink-0 text-honey" />
                    Only {stock} left in the shop right now
                  </li>
                )}
                {outOfStock && (
                  <li className="flex items-center gap-2 font-medium text-destructive">
                    <Package aria-hidden="true" className="size-3.5 shrink-0" />
                    Out of stock — ask the team about restock
                  </li>
                )}
                {product.prescriptionRequired && (
                  <li className="flex items-center gap-2">
                    <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0 text-honey" />
                    Rx item — attach your prescription at checkout for pharmacist review
                  </li>
                )}
              </ul>
            </div>

            {/* Frequently-bought-together kit */}
            {bundleCompanions.length > 0 && !outOfStock && (
              <BundleBox product={product} companions={bundleCompanions} />
            )}

            <Separator className="my-6" />

            <section aria-labelledby="about-product">
              <h2 id="about-product" className="text-sm font-semibold uppercase tracking-wide text-foreground">
                About this product
              </h2>
              <p className="mt-3 text-base leading-8 text-muted-foreground">
                {product.description}
              </p>
            </section>

            <section aria-labelledby="usage-product" className="mt-6">
              <h2 id="usage-product" className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Usage information
              </h2>
              <p className="mt-3 rounded-2xl bg-secondary/60 p-4 text-sm leading-7 text-secondary-foreground">
                {product.usageInfo}
              </p>
              {product.prescriptionRequired && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl bg-honey-soft/40 p-4 text-sm leading-6 text-accent-foreground">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  This medicine can only be dispensed against a valid
                  prescription. Add it to your basket and attach the
                  prescription at checkout, or use Request Medicine.
                </p>
              )}
            </section>

            {/* Secondary CTAs (screen only) */}
            <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="wa-cta flex-1 rounded-full px-6 shadow-md shadow-[#1faa53]/25">
                <a
                  href={whatsappLink(whatsappMessages.product(product.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp_click", { source: "product-detail", product: product.slug })}
                >
                  <MessageCircle aria-hidden="true" className="size-4.5" />
                  Ask About Availability
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <a href={business.phoneHref} onClick={() => track("call_click", { source: "product-detail" })}>
                  <Phone aria-hidden="true" className="size-4.5" />
                  Call
                </a>
              </Button>
              <ShareButton
                title={product.name}
                text={product.tagline}
                url={`${site.url}/products/${product.slug}`}
                source="product-detail"
              />
            </div>
            {/* Print-only footer: URL + date + availability note. */}
            <div className="print-only mt-8 border-t border-black/20 pt-4 text-xs leading-5 text-black">
              <p className="font-semibold">{product.name} — {business.name}</p>
              <p>{site.url}/products/{product.slug}</p>
              <p>
                {t("print.productNote")} · {printedOn}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Customer reviews — rating + comments, submittable */}
        <ProductReviews slug={product.slug} productName={product.name} />

        {/* Q&A — ask the pharmacist; answers appear once staff reply */}
        <ProductQuestions slug={product.slug} productName={product.name} />

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-16">
            <h2
              id="related-heading"
              className="font-display text-2xl font-semibold text-foreground"
            >
              More in {product.category}
            </h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal as="li" key={p.slug} delay={(i % 3) as 0 | 1 | 2}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
