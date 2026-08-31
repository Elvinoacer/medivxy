"use client";

import { useLanguage } from "@/components/site/language-provider";
import { cn } from "@/lib/utils";

/**
 * Compact EN | SW segmented toggle shown in the header.
 * Keyboard accessible (real buttons), the active side is announced via
 * aria-pressed, and the label swells on focus for touch users.
 */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLanguage();

  const sides: Array<{ value: "en" | "sw"; short: string; full: string }> = [
    { value: "en", short: "EN", full: t("lang.fullEnglish") },
    { value: "sw", short: "SW", full: t("lang.fullSwahili") },
  ];

  return (
    <div
      role="group"
      aria-label={t("lang.aria")}
      className={cn(
        "lang-toggle inline-flex items-center rounded-full border border-border bg-secondary/60 p-0.5",
        compact ? "h-8" : "h-9"
      )}
    >
      {sides.map((side, i) => {
        const active = lang === side.value;
        return (
          <button
            key={side.value}
            type="button"
            aria-pressed={active}
            onClick={() => !active && setLang(side.value)}
            title={side.full}
            className={cn(
              "inline-flex min-h-7 items-center justify-center rounded-full px-2.5 text-[0.6875rem] font-semibold tracking-wide transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              i === 0 && "mr-0.5",
              active
                ? "lang-toggle-active bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            {side.short}
            <span className="sr-only"> — {side.full}</span>
          </button>
        );
      })}
    </div>
  );
}
