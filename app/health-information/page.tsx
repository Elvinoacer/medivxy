import type { Metadata } from "next";
import { ArticlesView } from "@/components/site/views/articles-view";

export const metadata: Metadata = {
  title: "Health Information",
  description:
    "Practical health articles from Medivyx Medical Care — storing medicines safely, first aid kits, understanding prescriptions and family medicine safety.",
  alternates: { canonical: "/health-information" },
  openGraph: { title: "Health Information | Medivyx", url: "/health-information" },
};

export default function Page() {
  return <ArticlesView />;
}
