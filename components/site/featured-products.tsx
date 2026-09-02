import { SectionHeading } from "@/components/site/section-heading";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import { getFeaturedProducts } from "@/lib/data";
import { ArrowRight } from "lucide-react";

/** Featured products strip for the homepage. */
export function FeaturedProducts() {
  const featured = getFeaturedProducts().slice(0, 6);
  return (
    <section aria-labelledby="featured-heading" className="bg-card/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Popular right now"
          titleId="featured-heading"
          title="Products your neighbours ask for most"
          description="A quick look at everyday essentials — ask the team about anything else you need."
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product, i) => (
            <Reveal as="li" key={product.slug} delay={(i % 3) as 0 | 1 | 2}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </ul>
        <Reveal delay={2} className="mt-8 text-center">
          <SiteLink
            href="/products"
            trackLabel="featured-all-products"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            Browse all products
            <ArrowRight aria-hidden="true" className="size-4" />
          </SiteLink>
        </Reveal>
      </div>
    </section>
  );
}
