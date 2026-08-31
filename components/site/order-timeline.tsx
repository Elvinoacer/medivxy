import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MedicineRequestStatus } from "@/lib/types";

/**
 * Vertical status timeline for a medicine request (order-tracking UX).
 * Progress comes from the stored status — the current step is emphasized
 * with a soft pulse, completed steps carry a check.
 */

const STATUS_STEP: Record<MedicineRequestStatus, number> = {
  received: 0,
  confirmed: 1,
  ready: 2,
  fulfilled: 3,
};

const STEP_NOTES: Record<MedicineRequestStatus, string> = {
  received: "We have your request — the team will review it shortly.",
  confirmed: "A pharmacist has reviewed and confirmed your request.",
  ready: "Your items are prepared — collect them or await delivery.",
  fulfilled: "All done. Thank you for choosing Medivyx.",
};

export function OrderTimeline({
  status,
  fulfilment,
}: {
  status: MedicineRequestStatus;
  fulfilment: "pickup" | "delivery";
}) {
  const steps =
    fulfilment === "delivery"
      ? ["Request received", "Confirmed by the team", "Dispatched for delivery", "Delivered"]
      : ["Request received", "Confirmed by the team", "Ready for pickup", "Collected"];
  const current = STATUS_STEP[status];
  const stepNotes =
    status === "ready" && fulfilment === "delivery"
      ? {
          ...STEP_NOTES,
          ready: "Your items are on the way — the team will share delivery details.",
        }
      : STEP_NOTES;

  return (
    <ol aria-label="Request progress" className="mt-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            style={{ animationDelay: `${i * 120}ms` }}
            className="timeline-step relative flex gap-4 pb-7 last:pb-0"
          >
            {i < steps.length - 1 && (
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
                  {stepNotes[status]}
                </p>
              )}
              {done && status === "fulfilled" && i === 2 && (
                <p className="mt-0.5 text-xs text-muted-foreground">Completed</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
