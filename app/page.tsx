import { HomeView } from "@/components/site/views/home-view";
import { faqs } from "@/lib/data";
import { escapeJsonLd } from "@/lib/utils";

export default function Page() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <HomeView />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(faqJsonLd) }}
      />
    </>
  );
}
