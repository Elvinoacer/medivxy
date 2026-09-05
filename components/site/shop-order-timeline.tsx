import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

/**
 * Vertical status timeline for a SHOP order (ORD-XXXX).
 * Prescription orders pass through an explicit pharmacist-review step;
 * regular orders skip it. Current step pulses, completed steps carry a check.
 */

const STEP_BY_STATUS: Record<OrderStatus, number> = {
  received: 0,
  reviewing: 1,
  preparing: 2,
  ready: 3,
  completed: 4,
};

const STEP_NOTES: Record<OrderStatus, string> = {
  received: "Order received — the team is checking availability.",
  reviewing: "The pharmacist is reviewing your prescription.",
  preparing: "Your items are being packed and labelled.",
  ready: "Everything is packed — collect it or await the courier.",
  completed: "All done. Thank you for shopping with Medivyx.",
};

export function ShopOrderTimeline({
  status,
  fulfilment,
  hasPrescriptionItems,
}: {
  status: OrderStatus;
  fulfilment: "pickup" | "delivery";
  hasPrescriptionItems: boolean;
}) {
  const baseSteps =
    fulfilment === "delivery"
      ? [
          "Order received",
          ...(hasPrescriptionItems ? ["Pharmacist review" as string] : []),
          "Packed",
          "Out for delivery",
          "Delivered",
        ]
      : [
          "Order received",
          ...(hasPrescriptionItems ? ["Pharmacist review" as string] : []),
          "Packed",
          "Ready for pickup",
          "Collected",
        ];

  // Map statuses onto the (possibly Rx-shortened) step list. Non-Rx orders
  // never sit on "reviewing" — if one does (legacy/manual edit) it anchors to
  // the "Order received" step instead of jumping ahead to "Packed".
  const rawIdx = STEP_BY_STATUS[status];
  const current = Math.min(
    hasPrescriptionItems ? rawIdx : Math.max(0, rawIdx - (rawIdx > 0 ? 1 : 0)),
    baseSteps.length - 1
  );

  return (
    <ol aria-label="Order progress" className="mt-2">
      {baseSteps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            style={{ animationDelay: `${i * 120}ms` }}
            className="timeline-step relative flex gap-4 pb-7 last:pb-0"
          >
            {i < baseSteps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-9 left-[15px] h-[calc(100%-1.75rem)] w-0.5 rounded-full",
                  done ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/15 text-primary ring-2 ring-primary",
                !done && !active && "bg-muted text-muted-foreground"
              )}
            >
              {active && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20 [animation-duration:2s]" />
              )}
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  active ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground"
                )}
              >
                {label}
                <span className="sr-only">
                  {done ? " (completed)" : active ? " (current step)" : " (pending)"}
                </span>
              </p>
              {active && (
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  {STEP_NOTES[status]}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
