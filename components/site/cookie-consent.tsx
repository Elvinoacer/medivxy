"use client";

import { useEffect, useState } from "react";
import { Cookie, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONSENT_KEY,
  setAnalyticsConsent,
  type ConsentValue,
} from "@/lib/analytics";
import { useLanguage } from "@/components/site/language-provider";
import { cn } from "@/lib/utils";

/**
 * Analytics cookie notice — demo-style Kenya Data Protection Act behaviour.
 * Nothing is sent to /api/track until the visitor picks "Allow analytics".
 * The choice is remembered in localStorage and can be changed by clearing
 * site data. Rendered once per visitor.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  // Decide AFTER mount so SSR markup is identical (hydration-safe).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (stored !== "accepted" && stored !== "essential") {
        const t = setTimeout(() => setVisible(true), 900);
        return () => clearTimeout(t);
      }
    } catch {
      // storage unavailable — skip the banner rather than nagging
    }
  }, []);

  function decide(value: ConsentValue) {
    setAnalyticsConsent(value);
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Analytics cookie notice"
      data-state={visible ? "open" : "closed"}
      className={cn(
        "no-print fixed inset-x-3 z-50 transition-all duration-500 ease-out",
        // Sits above the mobile bottom nav; floats at the bottom on desktop.
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] sm:bottom-5",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0"
      )}
      style={{ visibility: visible ? "visible" : "hidden" }}
    >
      <div className="mx-auto max-w-3xl rounded-2xl border bg-card/98 p-4 shadow-xl ring-1 ring-border/60 backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <Cookie className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("consent.title")}
            </p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("consent.body")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              size="sm"
              variant="outline"
              onClick={() => decide("essential")}
              className="h-9 rounded-full active:scale-[0.97]"
            >
              {t("consent.essential")}
            </Button>
            <Button
              size="sm"
              onClick={() => decide("accepted")}
              className="h-9 rounded-full px-5 active:scale-[0.97]"
            >
              <MessageCircle aria-hidden="true" className="size-3.5" />
              {t("consent.allow")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
