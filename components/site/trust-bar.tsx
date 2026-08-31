import { Pill, Package, FileText, MapPin } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

/**
 * Trust bar directly under the hero (research.md §5).
 * Only general claims — no invented certifications. Once the business
 * provides documentation, items can become e.g. "PPB Licensed".
 */
const ITEMS = [
  { icon: Pill, label: "Pharmacy Services" },
  { icon: Package, label: "Healthcare Products" },
  { icon: FileText, label: "Prescription Support" },
  { icon: MapPin, label: "Convenient Local Care" },
];

export function TrustBar() {
  return (
    <section
      aria-label="What Medivyx offers"
      className="border-b bg-white/70"
    >
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {ITEMS.map((item, i) => (
            <Reveal as="li" key={item.label} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="flex items-center gap-3 rounded-xl bg-background/60 px-3 py-3 ring-1 ring-border/50">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon aria-hidden="true" className="size-4.5" />
                </span>
                <span className="text-sm font-semibold text-foreground/85">
                  {item.label}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
