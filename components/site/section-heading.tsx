import { cn } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  titleId?: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          {eyebrow}
        </p>
      )}
      <h2
        id={titleId}
        className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
      >
        {title}
      </h2>
      {/* Brand accent rule — small honey→emerald gradient detail */}
      <span
        aria-hidden="true"
        className={cn(
          "mt-4 block h-1 w-16 rounded-full bg-gradient-to-r from-honey via-primary/70 to-primary/10",
          align === "center" && "mx-auto bg-gradient-to-l"
        )}
      />
      {description && (
        <p
          className={cn(
            "mt-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
