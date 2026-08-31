import { ChevronRight } from "lucide-react";
import { SiteLink } from "@/components/site/link";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  /** Omit for the current (last) page. */
  href?: string;
}

/**
 * Accessible breadcrumbs (SEO + research.md §26 wayfinding).
 * Rendered as nav > ol; the last item carries aria-current="page".
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6", className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground/50"
                />
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "max-w-[16rem] truncate",
                    isLast && "font-medium text-foreground",
                  )}
                >
                  {item.label}
                </span>
              ) : (
                <SiteLink
                  href={item.href}
                  trackLabel="breadcrumb"
                  className="rounded-sm underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {item.label}
                </SiteLink>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
