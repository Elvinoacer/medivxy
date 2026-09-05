import { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsView } from "@/components/site/views/products-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Healthcare Products",
  description:
    "Browse the Medivyx product catalogue — medicines, wellness, baby care, personal care and medical supplies in Roysambu, Nairobi. Ask the team about availability.",
  alternates: { canonical: "/products" },
  openGraph: { title: "Medivyx Product Catalogue", url: "/products" },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/2" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <ProductsView />
    </Suspense>
  );
}
