"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/business";

/**
 * Root error boundary — previously any server/render error fell through to
 * Next.js's default crash page, losing the site's navigation and tone.
 * This keeps the shell usable and offers a reset + human help.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for diagnostics (server logs / reporting service in production).
    console.error("Medivyx page error:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-honey-soft/60 text-accent-foreground">
        <AlertTriangle aria-hidden="true" className="size-8" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This page hit an unexpected problem. Trying again usually fixes it —
        and if it doesn&apos;t, the Medivyx team is one message away.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} className="rounded-full px-6">
          <RefreshCw aria-hidden="true" className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link href="/">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6">
          <a
            href={whatsappLink("Hi Medivyx, I had a problem using your website.")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" className="size-4" />
            Tell us what happened
          </a>
        </Button>
      </div>
    </main>
  );
}
