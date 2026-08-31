import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/site/views/product-view";
import { getProduct, products } from "@/lib/data";
import { site } from "@/lib/business";
import { escapeJsonLd } from "@/lib/utils";

export function generateStaticParams(): { slug: string }[] {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: `${product.name} — ${product.tagline}. ${product.description}`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} | Medivyx Medical Care`,
      description: product.tagline,
      url: `/products/${product.slug}`,
    },
  };
}

export default async function Page({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category,
    brand: { "@type": "Brand", name: "Medivyx Medical Care" },
    url: `${site.url}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      availability:
        product.prescriptionRequired || product.availability === "ask"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      priceCurrency: "KES",
      price: undefined,
      url: `${site.url}/products/${product.slug}`,
    },
    additionalProperty: {
      "@type": "PropertyValue",
      name: "PrescriptionRequired",
      value: product.prescriptionRequired ? "true" : "false",
    },
  };

  return (
    <>
      <ProductView product={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
      />
    </>
  );
}
