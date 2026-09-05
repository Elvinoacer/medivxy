import type { Metadata } from "next";
import { TrackView } from "@/components/site/views/track-view";

export const metadata: Metadata = {
  title: "Track an Order, Request or Booking",
  description:
    "Track your shop order (ORD-XXXX), medicine request (MDX-XXXX) or consultation booking (BKG-XXXX) with Medivyx Medical Care — see live progress from received to ready.",
  alternates: { canonical: "/track" },
  openGraph: { title: "Track an Order, Request or Booking | Medivyx", url: "/track" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const initialRef =
    typeof ref === "string" && /^(?:ord|mdx|bkg)[-\s]?[a-z0-9]{4}$/i.test(ref)
      ? ref.slice(0, 12)
      : undefined;
  // Keyed so navigating between ?ref= values remounts and auto-looks-up.
  return <TrackView key={initialRef ?? ""} initialRef={initialRef} />;
}
