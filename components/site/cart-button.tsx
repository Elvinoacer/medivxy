"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/cart-provider";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/** Header / navigation basket button with live item-count badge. */
export function CartButton({ className }: { className?: string }) {
  const { count, openCart, loaded } = useCart();
  const showBadge = loaded && count > 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        openCart();
        track("cart_open", { items: count });
      }}
      className={cn("relative rounded-full text-primary hover:bg-secondary hover:text-primary", className)}
      aria-label={showBadge ? `Open basket — ${count} item${count === 1 ? "" : "s"}` : "Open basket"}
      title="Your basket"
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {showBadge && (
        <span
          // key re-triggers the pop animation whenever the count changes.
          key={count}
          aria-hidden="true"
          className="badge-pop absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[0.625rem] font-bold tabular-nums text-primary-foreground shadow-sm"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Button>
  );
}
