import {
  Pill,
  Package,
  FileText,
  MapPin,
  Truck,
  Smartphone,
  CalendarCheck,
  HeartHandshake,
} from "lucide-react";

/**
 * Trust marquee directly under the hero (research.md §5, upgraded).
 * A gentle infinite scroll captures attention without being loud; hover
 * pauses it; the duplicated half is aria-hidden. Only general claims —
 * no invented certifications. Once the business provides documentation,
 * items can become e.g. "PPB Licensed".
 */
const ITEMS = [
  { icon: Pill, label: "Pharmacy Services" },
  { icon: Package, label: "Healthcare Products" },
  { icon: FileText, label: "Prescription Support" },
  { icon: Truck, label: "Same-day Delivery" },
  { icon: Smartphone, label: "M-Pesa & Card Checkout" },
  { icon: CalendarCheck, label: "Free Consultations" },
  { icon: HeartHandshake, label: "Baby & Family Care" },
  { icon: MapPin, label: "Convenient Local Care" },
];

export function TrustBar() {
  return (
    <section aria-label="What Medivyx offers" className="border-b bg-card/60">
      <div className="mx-auto max-w-6xl overflow-hidden px-0 py-4 sm:px-6">
        <div className="relative">
          {/* Edge fades */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card/60 to-transparent sm:w-16"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-card/60 to-transparent sm:w-16"
          />
          <div className="marquee-track flex w-max items-center gap-3 px-4 sm:px-6">
            {[...ITEMS, ...ITEMS].map((item, i) => (
              <div
                key={`${item.label}-${i}`}
                aria-hidden={i >= ITEMS.length ? true : undefined}
                className="flex shrink-0 items-center gap-2.5 rounded-full bg-background/70 px-4 py-2 ring-1 ring-border/50"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon aria-hidden="true" className="size-4" />
                </span>
                <span className="whitespace-nowrap text-sm font-semibold text-foreground/85">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
