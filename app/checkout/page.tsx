import type { Metadata } from "next";
import { CheckoutView } from "@/components/site/views/checkout-view";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Review your basket, choose pickup or delivery and pay securely — M-Pesa, card or pay on collection. Prescription items are reviewed by the pharmacist first.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
