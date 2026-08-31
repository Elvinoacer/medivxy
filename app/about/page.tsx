import type { Metadata } from "next";
import { AboutView } from "@/components/site/views/about-view";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Medivyx Medical Care provides accessible healthcare and pharmacy services for individuals and families in Roysambu, Nairobi — making everyday healthcare easier to access, understand and manage.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Medivyx Medical Care",
    description:
      "Accessible healthcare and pharmacy services for individuals and families in Roysambu, Nairobi.",
    url: "/about",
  },
};

export default function Page() {
  return <AboutView />;
}
