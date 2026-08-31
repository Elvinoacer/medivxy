"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LANG_KEY, translate, type Lang } from "@/lib/i18n";
import { track } from "@/lib/analytics";

/**
 * Language context — English ↔ Kiswahili toggle for the key site surfaces
 * (research.md §29 Kenyan audience). The choice persists in localStorage and
 * `document.documentElement.lang` follows it so screen readers switch voice.
 *
 * Hydration-safe: the server render always starts in English; a saved
 * preference is restored in a post-mount effect (same pattern as the theme).
 */

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => undefined,
  t: (key) => translate("en", key),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Restore a saved preference after mount (never during render — that would
  // cause a hydration mismatch between the SSR HTML and the first paint).
  // Indirect setState (open-status pattern) — runs once after mount.
  useEffect(() => {
    const restore = () => {
      try {
        const saved = window.localStorage.getItem(LANG_KEY);
        if (saved === "sw" || saved === "en") {
          setLangState(saved);
          document.documentElement.lang = saved === "sw" ? "sw" : "en";
        }
      } catch {
        // storage unavailable — default English stays
      }
    };
    restore();
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // preference simply can't be remembered
    }
    document.documentElement.lang = next === "sw" ? "sw" : "en";
    track("language_toggle", { lang: next });
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: (key: string) => translate(lang, key) }),
    [lang, setLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
