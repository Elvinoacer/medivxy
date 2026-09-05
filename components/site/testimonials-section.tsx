"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

/**
 * Community voices — auto-advancing, accessible carousel (pause on hover /
 * focus, arrows + dots, respects prefers-reduced-motion). Quotes are
 * illustrative placeholders for the demo, as noted below.
 */
const TESTIMONIALS = [
  {
    quote:
      "I messaged ahead and my mum's medication was packed and waiting when I arrived. That kind of thinking ahead matters.",
    name: "Wanjiku M.",
    detail: "Roysambu resident",
  },
  {
    quote:
      "They took time to explain how to take my prescription properly — no rushing, no judgement. Exactly what a pharmacy should feel like.",
    name: "Brian O.",
    detail: "Repeat customer",
  },
  {
    quote:
      "Sent a photo of my prescription on WhatsApp and got a clear answer the same day. Simple, and respectful of my time.",
    name: "Achieng' K.",
    detail: "First-time visitor",
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % TESTIMONIALS.length),
    []
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length),
    []
  );

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(next, 6000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, next]);

  const current = TESTIMONIALS[index];

  return (
    <section aria-labelledby="testimonials-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Community voices"
          titleId="testimonials-heading"
          title="What our neighbours say"
          description="A feel for the experience we're building — friendly, unhurried, dependable."
        />

        <Reveal className="mt-12">
          <div
            className="relative mx-auto max-w-3xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <div
              aria-live="polite"
              className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-md sm:p-10"
            >
              <div className="flex items-center justify-between">
                <Quote aria-hidden="true" className="size-8 text-primary/40" />
                <div className="flex gap-0.5" aria-label="5 star rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      className="size-4 fill-honey text-honey"
                    />
                  ))}
                </div>
              </div>
              <blockquote
                key={index}
                className="reveal-fade mt-6 font-display text-xl font-medium leading-relaxed text-foreground sm:text-2xl"
              >
                “{current.quote}”
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-full bg-honey-soft font-display text-lg font-bold text-honey"
                >
                  {current.name.charAt(0)}
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{current.name}</span>
                  <span className="block text-sm text-muted-foreground">{current.detail}</span>
                </span>
                {/* Dots */}
                <span className="ml-auto hidden items-center gap-2 sm:flex">
                  {TESTIMONIALS.map((t, i) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Show testimonial ${i + 1} of ${TESTIMONIALS.length}`}
                      aria-current={i === index}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        i === index ? "w-6 bg-primary" : "w-2 bg-border hover:bg-primary/50"
                      )}
                    />
                  ))}
                </span>
              </figcaption>
            </div>

            {/* Arrows */}
            <button
              type="button"
              onClick={prev}
              aria-label="Previous testimonial"
              className="absolute -left-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-all hover:bg-secondary md:flex"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next testimonial"
              className="absolute -right-4 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow-md transition-all hover:bg-secondary md:flex"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </Reveal>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Illustrative feedback for this demo — real customer quotes will
          replace these once collected.
        </p>
      </div>
    </section>
  );
}
