import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

/**
 * Community voices — illustrative testimonials for the demo.
 * These are placeholder quotes (clearly noted): swap in real, permissioned
 * customer feedback once the business collects it.
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
  return (
    <section aria-labelledby="testimonials-heading" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Community voices"
          titleId="testimonials-heading"
          title="What our neighbours say"
          description="A feel for the experience we're building — friendly, unhurried, dependable."
        />

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal as="li" key={t.name} delay={i as 0 | 1 | 2}>
              <figure className="flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
                <Quote
                  aria-hidden="true"
                  className="size-6 shrink-0 text-primary/45"
                />
                <blockquote className="mt-4 flex-1 text-sm leading-6 text-foreground/85">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t pt-4">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-honey-soft text-sm font-bold text-honey"
                  >
                    {t.name.charAt(0)}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t.detail}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Illustrative feedback for this demo — real customer quotes will
          replace these once collected.
        </p>
      </div>
    </section>
  );
}
