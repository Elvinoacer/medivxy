"use client";

import { useOpenStatus } from "@/lib/open-status";
import { useLanguage } from "@/components/site/language-provider";

/**
 * Floating hero card showing the live opening status for today.
 * Dynamic — always matches `business.hours` for the current day
 * (previously this was hard-coded to weekday hours).
 */
export function OpenTodayCard() {
  const { ready, open, range } = useOpenStatus();
  const { t } = useLanguage();

  return (
    <div className="absolute -top-4 right-4 hidden rounded-2xl bg-card/95 px-4 py-3 shadow-lg ring-1 ring-border backdrop-blur md:block">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span aria-hidden="true" className="relative flex size-2">
          {ready && open && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-50" />
          )}
          <span
            className={`relative inline-flex size-2 rounded-full ${
              !ready
                ? "bg-muted-foreground/40"
                : open
                  ? "bg-emerald-600"
                  : "bg-amber-600"
            }`}
          />
        </span>
        {ready ? (open ? t("status.open") : t("status.closed")) : t("status.today")}
      </p>
      <p className="font-display text-lg font-semibold text-primary">{range}</p>
    </div>
  );
}
