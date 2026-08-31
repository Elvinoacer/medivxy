import type { Metadata } from "next";
import { PharmacyView } from "@/components/site/views/pharmacy-view";

export const metadata: Metadata = {
  title: "Pharmacy & Prescriptions",
  description:
    "Submit your prescription ahead of time — the Medivyx pharmacy team reviews it, confirms with you and prepares your medicine for pickup or delivery in Roysambu, Nairobi.",
  alternates: { canonical: "/pharmacy" },
  openGraph: { title: "Medivyx Pharmacy & Prescriptions", url: "/pharmacy" },
};

export default function Page() {
  return <PharmacyView />;
}
