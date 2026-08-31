"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Back-to-top button — appears after ~1.5 screens of scrolling.
 * Sits bottom-LEFT so it never collides with the WhatsApp FAB (bottom-right)
 * and floats above the mobile quick-nav bar.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      className="no-print fixed bottom-[88px] left-4 z-40 flex size-12 items-center justify-center rounded-full border bg-card/95 text-foreground/70 shadow-lg shadow-foreground/10 backdrop-blur transition-all hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:bottom-8"
    >
      <ArrowUp aria-hidden="true" className="size-5" />
    </button>
  );
}
