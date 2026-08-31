"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { faqs } from "@/lib/data";

/** FAQ section (research.md §16). Answers keep unverified details configurable. */
export function FaqSection({ compact = false }: { compact?: boolean }) {
  const items = compact ? faqs.slice(0, 5) : faqs;
  return (
    <section aria-labelledby="faq-heading" className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="FAQ"
          titleId="faq-heading"
          title="Questions customers ask us"
          description="Straight answers about prescriptions, requests, delivery and finding us."
        />
        <Reveal delay={1} className="mt-10">
          <Accordion
            type="single"
            collapsible
            className="rounded-2xl border bg-card px-5 shadow-sm sm:px-6"
          >
            {items.map((faq, i) => (
              <AccordionItem key={faq.question} value={`faq-${i}`}>
                <AccordionTrigger className="py-5 text-left font-display text-base font-semibold hover:no-underline sm:text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-7 text-muted-foreground sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}
