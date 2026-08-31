import type { Metadata } from "next";
import { ContactView } from "@/components/site/views/contact-view";
import { business, site } from "@/lib/business";
import { escapeJsonLd } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact & Location",
  description:
    "Contact Medivyx Medical Care in Roysambu, Nairobi — call, WhatsApp, email or visit the pharmacy. Get directions and opening hours.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact Medivyx Medical Care", url: "/contact" },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: business.name,
    description: site.seoDescription,
    url: `${site.url}/contact`,
    telephone: business.phone,
    email: business.email,
    image: `${site.url}/images/hero-pharmacy.webp`,
    priceRange: "KES",
    address: {
      "@type": "PostalAddress",
      streetAddress: business.area,
      addressLocality: business.city,
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: business.mapCoordinates.lat,
      longitude: business.mapCoordinates.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "10:00",
        closes: "16:00",
      },
    ],
    hasMap: business.mapsSearchUrl,
  };

  return (
    <>
      <ContactView />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(jsonLd) }}
      />
    </>
  );
}
