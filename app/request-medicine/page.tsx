import type { Metadata } from "next";
import { RequestMedicineView } from "@/components/site/views/request-medicine-view";

export const metadata: Metadata = {
  title: "Request Medicine",
  description:
    "Request medicine or submit a prescription to Medivyx Medical Care — upload your prescription, choose pickup or delivery, and the pharmacy team will contact you.",
  alternates: { canonical: "/request-medicine" },
  openGraph: { title: "Request Medicine | Medivyx", url: "/request-medicine" },
};

export default function Page() {
  return <RequestMedicineView />;
}
