import type { Metadata } from "next";
import { AdminView } from "@/components/site/views/admin-view";

export const metadata: Metadata = {
  title: "Analytics Demo",
  description: "Demo analytics dashboard for the Medivyx Medical Care website.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminView />;
}
