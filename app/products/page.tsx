import type { Metadata } from "next";
import { ProductsView } from "@/components/site/views/products-view";

export const metadata: Metadata = {
  title: "Healthcare Products",
  description:
    "Browse the Medivyx product catalogue — medicines, wellness, baby care, personal care and medical supplies in Roysambu, Nairobi. Ask the team about availability.",
  alternates: { canonical: "/products" },
  openGraph: { title: "Medivyx Product Catalogue", url: "/products" },
};

export default function Page() {
  return <ProductsView />;
}
