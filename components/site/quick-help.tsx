import { MapPin, Phone, PackageSearch, Boxes } from "lucide-react";
import { SiteLink } from "@/components/site/link";

/**
 * "What can we help you with?" quick-help chips (research.md §30)
 * — the immediate next step after the hero.
 */
const CHIPS = [
  {
    href: "/products",
    icon: Boxes,
    title: "Medicines",
    subtitle: "Browse the catalogue",
  },
  {
    href: "/pharmacy",
    icon: MapPin,
    title: "Pharmacy",
    subtitle: "Prescriptions & pickup",
  },
  {
    href: "/track",
    icon: PackageSearch,
    title: "Track a Request",
    subtitle: "Check request status",
  },
  {
    href: "/contact",
    icon: Phone,
    title: "Contact Us",
    subtitle: "Call, WhatsApp, visit",
  },
];

export function QuickHelp() {
  return (
    <section aria-label="What can we help you with?" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <p className="mb-4 text-center font-display text-xl font-semibold text-foreground">
          What can we help you with?
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {CHIPS.map((chip) => (
            <li key={chip.title}>
              <SiteLink
                href={chip.href}
                trackLabel={`quick-help-${chip.title.toLowerCase().replace(/\s+/g, "-")}`}
                className="group flex h-full flex-col items-center gap-2 rounded-2xl border bg-card p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/25"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <chip.icon aria-hidden="true" className="size-5" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {chip.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {chip.subtitle}
                </span>
              </SiteLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
