import { cn } from "@/lib/utils";

/** Medivyx brand mark: warm emerald cross with a leaf motif. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label="Medivyx Medical Care logo"
      className={cn("size-9", className)}
    >
      <rect x="1" y="1" width="38" height="38" rx="11" fill="currentColor" opacity="0.08" />
      <rect x="1" y="1" width="38" height="38" rx="11" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M20 9.5c1.9 0 3.5 1.6 3.5 3.5v3.5H27a3.5 3.5 0 1 1 0 7h-3.5V27a3.5 3.5 0 1 1-7 0v-3.5H13a3.5 3.5 0 1 1 0-7h3.5V13c0-1.9 1.6-3.5 3.5-3.5Z"
        fill="currentColor"
      />
      <path
        d="M20 24.6c3-3.7 6.4-4.6 9.4-4.1-.5 3.5-3.2 6.4-6.9 6.9-1.6.2-2.5 0-2.5 0"
        fill="var(--honey)"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-primary", className)}>
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display font-semibold tracking-tight text-foreground",
            compact ? "text-lg" : "text-xl"
          )}
        >
          MEDIVYX
        </span>
        <span
          className={cn(
            "text-[0.625rem] font-medium uppercase tracking-[0.22em] text-muted-foreground",
            compact && "hidden sm:block"
          )}
        >
          Medical Care
        </span>
      </span>
    </span>
  );
}
