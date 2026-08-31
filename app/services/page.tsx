import type { Metadata } from "next";
import { ServicesView } from "@/components/site/views/services-view";
import { services } from "@/lib/data";
import { escapeJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Our Services",
  description:
    "Pharmacy services, healthcare products, prescription support, personal & family care, medical supplies and friendly customer support at Medivyx Medical Care, Roysambu.",
  alternates: { canonical: "/services" },
  openGraph: { title: "Medivyx Services", url: "/services" },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "MedicalTherapy",
        name: s.name,
        description: s.short,
      },
    })),
  };
  return (
    <>
      <ServicesView />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
      />
    </>
  );
}
