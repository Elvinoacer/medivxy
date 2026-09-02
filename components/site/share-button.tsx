"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Link2, Share2 } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Native share with clipboard fallback (Web Share API + copy).
 * Used on product and article detail pages.
 */
export function ShareButton({
  title,
  text,
  url,
  source,
}: {
  title: string;
  text?: string;
  url: string;
  source: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareData = { title, text, url };
    track("share_click", { source, title: title.slice(0, 60) });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user dismissed the sheet — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link", {
        description: "Your browser blocked clipboard access — long-press the page URL instead.",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={`Share ${title}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-semibold text-foreground/80 shadow-sm transition-all hover:bg-secondary hover:text-primary active:scale-[0.98]"
    >
      {copied ? (
        <>
          <Check aria-hidden="true" className="size-4 text-emerald-600" />
          Link copied
        </>
      ) : (
        <>
          <Share2 aria-hidden="true" className="size-4" />
          Share
          <Link2 aria-hidden="true" className="size-3.5 text-muted-foreground/60" />
        </>
      )}
    </button>
  );
}
