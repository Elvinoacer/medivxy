"use client";

import { Home, Store, ShoppingBag, CalendarCheck, PackageSearch } from "lucide-react";
import { SiteLink } from "@/components/site/link";
import { useCart } from "@/components/site/cart-provider";
import { track } from "@/lib/analytics";
import { useLanguage } from "@/components/site/language-provider";
import { useCurrentPath } from "@/components/site/use-current-path";
import { cn } from "@/lib/utils";

/**
 * Mobile sticky bottom bar (research.md §18) — one-handed friendly.
 *
 * With the shop online, the basket is now a flagship action: the bar carries
 * Home · Shop · Basket (live count) · Book · Track. WhatsApp stays on the FAB
 * and Call/Request remain one tap away in the header sheet.
 */
export function MobileNavBar() {
  const currentPath = useCurrentPath();
  const { t } = useLanguage();
  const { count, openCart, loaded } = useCart();

  const isActive = (href: string) => {
    if (!currentPath) return false;
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  return (
    <nav
      aria-label="Quick mobile navigation"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        <MobileNavItem href="/" label={t("mobile.home")} icon={Home} trackLabel="mobile-home" active={isActive("/")} />
        <MobileNavItem
          href="/products"
          label={t("mobile.shop")}
          icon={Store}
          trackLabel="mobile-shop"
          active={isActive("/products")}
        />
        <li>
          <button
            type="button"
            onClick={() => {
              openCart();
              track("cart_open", { source: "mobile-bar", items: count });
            }}
            aria-label={loaded && count > 0 ? `Open basket — ${count} item${count === 1 ? "" : "s"}` : "Open basket"}
            className="relative flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="relative">
              <ShoppingBag aria-hidden="true" className="size-5" />
              {loaded && count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-1.5 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 py-0.5 text-[0.5625rem] font-bold tabular-nums text-primary-foreground"
                >
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            <span className="text-[0.625rem] font-medium">{t("mobile.cart")}</span>
          </button>
        </li>
        <MobileNavItem
          href="/book"
          label={t("mobile.book")}
          icon={CalendarCheck}
          trackLabel="mobile-book"
          active={isActive("/book")}
        />
        <MobileNavItem
          href="/track"
          label={t("mobile.track")}
          icon={PackageSearch}
          trackLabel="mobile-track"
          active={isActive("/track")}
        />
      </ul>
    </nav>
  );
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
  trackLabel,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  trackLabel: string;
  active: boolean;
}) {
  return (
    <li>
      <SiteLink
        href={href}
        trackLabel={trackLabel}
        ariaLabel={active ? `${label} (current page)` : undefined}
        className={cn(
          "relative flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 transition-colors",
          active
            ? "text-primary [span:last-child]:font-semibold"
            : "text-muted-foreground hover:text-primary",
        )}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute top-0 h-1 w-10 rounded-full bg-primary"
          />
        )}
        <Icon aria-hidden="true" className="size-5" />
        <span className="text-[0.625rem] font-medium">{label}</span>
      </SiteLink>
    </li>
  );
}
