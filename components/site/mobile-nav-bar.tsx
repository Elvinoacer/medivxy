"use client";

import { Home, Pill, CalendarCheck, PackageSearch, Phone } from "lucide-react";
import { SiteLink } from "@/components/site/link";
import { business } from "@/lib/business";
import { track } from "@/lib/analytics";
import { useLanguage } from "@/components/site/language-provider";
import { useCurrentPath } from "@/components/site/use-current-path";
import { cn } from "@/lib/utils";

/**
 * Mobile sticky bottom bar (research.md §18) — one-handed friendly.
 *
 * Previously: Home | Services | Products | WhatsApp | Call — the two
 * flagship actions (Request Medicine, Book) were missing from the most
 * reachable surface on the site, and WhatsApp duplicated the floating FAB
 * shown right above this bar. Now the bar carries the conversion actions
 * (Request · Book · Track) plus Home and Call; WhatsApp stays on the FAB,
 * and Services/Products/About remain one tap away in the header menu.
 */
export function MobileNavBar() {
  const currentPath = useCurrentPath();
  const { t } = useLanguage();

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
          href="/request-medicine"
          label={t("mobile.request")}
          icon={Pill}
          trackLabel="mobile-request"
          active={isActive("/request-medicine")}
        />
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
        <li>
          <a
            href={business.phoneHref}
            onClick={() => track("call_click", { source: "mobile-bar" })}
            className="flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-muted-foreground transition-colors hover:text-primary"
            aria-label={`Call ${business.name}`}
          >
            <Phone aria-hidden="true" className="size-5" />
            <span className="text-[0.625rem] font-medium">{t("mobile.call")}</span>
          </a>
        </li>
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
