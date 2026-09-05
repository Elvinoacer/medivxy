"use client";

import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, ShieldCheck, ArrowRight, Truck, BadgeCheck, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, formatKes } from "@/components/site/cart-provider";
import { SiteLink } from "@/components/site/link";
import { track } from "@/lib/analytics";
import { FREE_DELIVERY_OVER } from "@/lib/business";
import { PROMO_CODES } from "@/lib/promos";

/**
 * Slide-over shopping cart. Quantity steppers, remove, subtotal and a
 * prescription-aware notice that explains the Rx checkout flow before the
 * user invests time in it.
 */
export function CartSheet() {
  const {
    lines,
    cartOpen,
    closeCart,
    openCart,
    setQuantity,
    removeLine,
    subtotal,
    count,
    hasPrescriptionItems,
  } = useCart();

  const checkoutHref = "/checkout";
  const remaining = FREE_DELIVERY_OVER - subtotal;
  const freeDelivery = subtotal >= FREE_DELIVERY_OVER;
  const progress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_OVER) * 100));

  // Promo teaser (from lib/promos — the same codes checkout validates):
  // WELCOME10 always applies; FREESHIP unlocks past its minimum basket.
  const freeship = PROMO_CODES.find((p) => p.freeDelivery);
  const freeshipGap =
    freeship && subtotal < freeship.minSubtotal
      ? freeship.minSubtotal - subtotal
      : 0;

  return (
    <Sheet open={cartOpen} onOpenChange={(o) => (o ? openCart() : closeCart())}>
      <SheetContent
        side="right"
        className="flex w-[92vw] max-w-md flex-col gap-0 rounded-l-2xl p-0"
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <ShoppingBag aria-hidden="true" className="size-5 text-primary" />
            Your basket
            {count > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {count}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            {count > 0
              ? "Review your items — pay securely or reserve for pickup."
              : "Your basket is empty — add health essentials from the shop."}
          </SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-secondary">
              <ShoppingBag aria-hidden="true" className="size-9 text-primary" />
            </div>
            <p className="max-w-[26ch] text-sm leading-6 text-muted-foreground">
              Nothing here yet. Browse the catalogue for medicines, wellness and
              care essentials.
            </p>
            <Button asChild className="rounded-full px-6">
              <SiteLink href="/products" onClick={closeCart} trackLabel="cart-browse">
                Browse the shop
                <ArrowRight aria-hidden="true" className="size-4" />
              </SiteLink>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto scrollbar-thin">
              {lines.map((line) => (
                <li key={line.slug} className="flex gap-3 p-4">
                  <SiteLink
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    trackLabel="cart-item"
                    className="relative size-20 shrink-0 overflow-hidden rounded-xl border bg-secondary/60"
                    ariaLabel={`View ${line.name}`}
                  >
                    <Image
                      src={line.image}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </SiteLink>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <SiteLink
                        href={`/products/${line.slug}`}
                        onClick={closeCart}
                        trackLabel="cart-item-name"
                        className="text-sm font-semibold leading-snug text-foreground underline-offset-4 hover:underline"
                      >
                        {line.name}
                      </SiteLink>
                      <button
                        type="button"
                        onClick={() => {
                          removeLine(line.slug);
                          toast("Removed", { description: `${line.name} removed from your basket.` });
                        }}
                        aria-label={`Remove ${line.name} from basket`}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {line.packSize}
                      {line.prescriptionRequired && " · Rx"}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="inline-flex items-center rounded-full border">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.slug, line.quantity - 1)}
                          aria-label={`Decrease quantity of ${line.name}`}
                          className="flex size-8 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
                        >
                          <Minus aria-hidden="true" className="size-3.5" />
                        </button>
                        <span
                          aria-live="polite"
                          className="w-7 text-center text-sm font-semibold tabular-nums"
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (line.quantity >= 10) {
                              toast("Maximum 10 per item", {
                                description: "For larger quantities, message the team on WhatsApp.",
                              });
                              return;
                            }
                            setQuantity(line.slug, line.quantity + 1);
                          }}
                          aria-label={`Increase quantity of ${line.name}`}
                          className="flex size-8 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-secondary"
                        >
                          <Plus aria-hidden="true" className="size-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatKes(line.price * line.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t bg-card/70 p-4">
              {hasPrescriptionItems && (
                <p className="flex items-start gap-2 rounded-2xl bg-honey-soft/50 p-3 text-xs leading-5 text-accent-foreground">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  Your basket has prescription items — the pharmacist reviews
                  your prescription at checkout before they&rsquo;re dispensed.
                </p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-semibold text-foreground">
                  {formatKes(subtotal)}
                </span>
              </div>

              {/* Free-delivery meter — nudges baskets past the threshold */}
              {freeDelivery ? (
                <p className="flex items-center gap-2 rounded-xl bg-mint p-3 text-xs font-semibold text-mint-foreground">
                  <BadgeCheck aria-hidden="true" className="size-4 shrink-0" />
                  Free delivery unlocked — any zone, any day.
                </p>
              ) : (
                <div className="rounded-xl bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <Truck aria-hidden="true" className="size-3.5 shrink-0" />
                    Add {formatKes(remaining)} for free delivery
                  </p>
                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progress towards free delivery"
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {/* Promo teaser — codes are entered (and validated) at checkout */}
              <p className="flex items-start gap-2 rounded-xl bg-honey-soft p-3 text-xs font-medium leading-5 text-accent-foreground">
                <TicketPercent
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span>
                  Have a promo code? Apply it at checkout —{" "}
                  <span className="font-semibold">WELCOME10</span> takes 10% off
                  {freeshipGap > 0 && (
                    <>
                      {" "}· {formatKes(freeshipGap)} more unlocks{" "}
                      <span className="font-semibold">FREESHIP</span>
                    </>
                  )}
                  .
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Same-day delivery from KES 150 nearby · fees confirmed at checkout.
              </p>
              <Button
                asChild
                size="lg"
                className="w-full rounded-full text-base shadow-md shadow-primary/20"
              >
                <SiteLink
                  href={checkoutHref}
                  onClick={() => {
                    closeCart();
                    track("checkout_start", { source: "cart", value: subtotal });
                  }}
                  trackLabel="cart-checkout"
                >
                  Checkout
                  <ArrowRight aria-hidden="true" className="size-4.5" />
                </SiteLink>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="w-full rounded-full text-muted-foreground"
              >
                <SiteLink href="/products" onClick={closeCart} trackLabel="cart-keep-shopping">
                  Keep shopping
                </SiteLink>
              </Button>
              <Separator className="opacity-60" />
              <p className="text-center text-[0.6875rem] leading-4 text-muted-foreground">
                Demo checkout — no real payment is processed and no card data is
                stored.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
