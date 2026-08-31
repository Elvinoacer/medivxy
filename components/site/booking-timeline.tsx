import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/types";

/**
 * Vertical status timeline for a consultation booking (order-tracking UX).
 * Same visual language as <OrderTimeline />: the current step pulses
 * softly, completed steps carry a check.
 */

const STATUS_STEP: Record<BookingStatus, number> = {
  requested: 0,
  confirmed: 1,
  completed: 2,
};

const STEP_NOTES: Record<BookingStatus, string> = {
  requested: "We have your booking — the pharmacy team will confirm the slot shortly.",
  confirmed: "Your slot is confirmed. Arrive a few minutes early and ask at the counter.",
  completed: "All done — thank you for visiting Medivyx. See you next time!",
};

export function BookingTimeline({ status }: { status: BookingStatus }) {
  const steps = ["Booking received", "Confirmed by the team", "Consultation completed"];
  const current = STATUS_STEP[status];

  return (
    <ol aria-label="Booking progress" className="mt-2">
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
