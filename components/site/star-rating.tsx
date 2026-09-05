"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Star rating primitives shared by the reviews section and product cards.
 * Display: static, accessible summary. Input: 5 radio buttons (keyboard-friendly).
 */

export function StarRating({
  value,
  size = "sm",
  className,
  count,
}: {
  /** Rating out of 5 (decimals allowed). */
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Optional review count rendered beside the stars. */
  count?: number;
}) {
  const px = size === "sm" ? "size-3.5" : size === "md" ? "size-4" : "size-5";
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5${typeof count === "number" ? ` from ${count} review${count === 1 ? "" : "s"}` : ""}`}
    >
      <span aria-hidden="true" className="inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.max(0, Math.min(1, clamped - (i - 1)));
          return (
            <span key={i} className={cn("relative inline-block", px)}>
              <Star aria-hidden="true" className={cn(px, "absolute inset-0 text-muted-foreground/40")} />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star aria-hidden="true" className={cn(px, "fill-honey text-honey")} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      <span className="text-xs font-semibold tabular-nums text-foreground">
        {clamped.toFixed(1)}
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">
          ({count})
        </span>
      )}
    </span>
  );
}

export function StarRatingInput({
  value,
  onChange,
  legend,
}: {
  value: number;
  onChange: (rating: number) => void;
  legend: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset
      className="inline-flex items-center gap-3"
      onMouseLeave={() => setHover(0)}
    >
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex" role="radiogroup" aria-label={legend}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= shown;
          return (
            <label
              key={i}
              className="group relative cursor-pointer p-1"
              onMouseEnter={() => setHover(i)}
              title={`${i} star${i === 1 ? "" : "s"}`}
            >
              <input
                type="radio"
                name="review-rating"
                value={i}
                checked={value === i}
                onChange={() => onChange(i)}
                className="peer sr-only"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "size-6 transition-all duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
                  filled
                    ? "fill-honey text-honey scale-110"
                    : "text-muted-foreground/50 group-hover:text-honey/70"
                )}
              />
              <span className="sr-only">{i} star{i === 1 ? "" : "s"}</span>
            </label>
          );
        })}
      </div>
      <span aria-live="polite" className="min-w-16 text-xs font-medium text-muted-foreground">
        {["", "Poor", "Fair", "Good", "Very good", "Excellent"][shown]}
      </span>
    </fieldset>
  );
}
