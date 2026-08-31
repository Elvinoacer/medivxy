import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

/** Compact hero band for inner pages. */
export function PageHero({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-b bg-white/70", className)}>
      <div aria-hidden="true" className="absolute inset-0 brand-gradient-soft opacity-70" />
      <div
        aria-hidden="true"
        className="absolute -top-20 right-10 size-64 rounded-full bg-primary/8 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal className="max-w-2xl">
          {eyebrow && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {description}
            </p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
