"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-linked reading progress bar for long articles (research.md §15).
 * A thin brand-gradient line pinned above the sticky header; purely
 * decorative (aria-hidden) since the reading time is already announced.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1"
    >
      <div
        className="h-full bg-gradient-to-r from-honey via-primary to-primary"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );
}
