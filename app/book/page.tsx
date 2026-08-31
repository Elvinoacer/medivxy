import type { Metadata } from "next";
import { BookView } from "@/components/site/views/book-view";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description:
    "Book a free pharmacist consultation at Medivyx Medical Care in Roysambu, Nairobi — medicine questions, prescription review, blood pressure check or wellness advice. Pick a day and time slot and the team confirms.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a Consultation | Medivyx Medical Care",
    description:
      "Reserve a free consultation slot with a Medivyx pharmacist — the team confirms every booking.",
    url: "/book",
  },
};

export default function Page() {
  return <BookView />;
}
