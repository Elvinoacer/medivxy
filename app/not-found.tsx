import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center"
    >
      <p className="font-display text-7xl font-semibold text-primary/25">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">
        This page seems to be out of stock
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist — but our team can
        still help with whatever you need.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="rounded-full px-6">
          <Link href="/">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <a
            href="https://wa.me/254700000000?text=Hi%20Medivyx%2C%20I%20need%20some%20help."
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Ask on WhatsApp
          </a>
        </Button>
      </div>
    </main>
  );
}
