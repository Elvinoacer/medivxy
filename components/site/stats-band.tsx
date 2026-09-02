"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/site/reveal";
import { products, services, articles } from "@/lib/data";

/**
 * "Medivyx in numbers" band — counts animate up when scrolled into view.
 * Numbers are pulled from the site's own data so they stay truthful.
 */

const OPEN_DAYS = 7; // business.hours covers Mon–Sun (see lib/business.ts)

const STATS = [
  { value: products.length, label: "Products listed" },
  { value: services.length, label: "Services offered" },
  { value: articles.length, label: "Health guides" },
  { value: OPEN_DAYS, label: "Days open each week" },
];

function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const set = () => setDisplay(value);
      set();
      return;
    }

    let raf = 0;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;
      const duration = 900;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(eased * value));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  );
}

export function StatsBand() {
  return (
    <section aria-label="Medivyx in numbers" className="border-y bg-card/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal>
          <div className="grid grid-cols-2 gap-6 rounded-3xl bg-primary p-8 text-primary-foreground shadow-lg sm:p-10 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center lg:text-left"
              >
                <p className="font-display text-4xl font-semibold sm:text-5xl">
                  <CountUp value={stat.value} />
                </p>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-primary-foreground/75 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
