import { Clock, MapPin, MessageCircle, Boxes } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

/** "Why Medivyx?" differentiators (research.md §14). */
const REASONS = [
  {
    icon: MessageCircle,
    title: "Convenient",
    description:
      "Get in touch without unnecessary visits or phone calls — request ahead, ask first, then collect.",
  },
  {
    icon: MapPin,
    title: "Local",
    description:
      "Serving customers within the Roysambu community — a pharmacy that knows its neighbours.",
  },
  {
    icon: Clock,
    title: "Personal",
    description:
      "Talk directly to the pharmacy team, not a call centre. Real people, helpful answers.",
  },
  {
    icon: Boxes,
    title: "Accessible",
    description:
      "Find healthcare products and support from one place — medicines, essentials and advice together.",
  },
];

export function WhyMedivyx() {
  return (
    <section aria-labelledby="why-heading" className="border-y bg-white/70">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Why Medivyx"
          titleId="why-heading"
          title="A pharmacy built around how you actually live"
          description="Serious about healthcare, friendly about everything else."
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason, i) => (
            <Reveal as="li" key={reason.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="h-full rounded-2xl bg-background p-6 ring-1 ring-border/60 transition-shadow hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-xl bg-honey-soft/60 text-honey">
                  <reason.icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {reason.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {reason.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
