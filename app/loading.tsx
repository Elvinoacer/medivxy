import { Skeleton } from "@/components/ui/skeleton";

/**
 * Root loading UI — shown while a server-rendered route segment streams in.
 * A calm, layout-stable skeleton keeps the header/footer shell from jumping
 * (previously there was no loading state at all).
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"
    >
      {/* Page hero skeleton */}
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <Skeleton className="mx-auto h-6 w-40 rounded-full" />
        <Skeleton className="mx-auto h-10 w-3/4 rounded-2xl" />
        <Skeleton className="mx-auto h-5 w-full rounded-xl" />
        <Skeleton className="mx-auto h-5 w-2/3 rounded-xl" />
      </div>
      {/* Content grid skeleton */}
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border bg-card p-5">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
