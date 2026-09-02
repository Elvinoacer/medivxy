"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/**
 * Floating WhatsApp button — "Chat with Medivyx" (research.md §11).
 * Appears everywhere; gently dismissible.
 */
export function WhatsAppFab() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "fixed bottom-[76px] right-4 z-40 transition-all duration-500 lg:bottom-6 no-print",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      )}
    >
      <div className="group relative">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Hide the WhatsApp chat button"
          className="absolute -top-2.5 -right-2.5 z-10 flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-secondary hover:text-foreground before:absolute before:-inset-1.5 before:rounded-full before:content-['']"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
        <a
          href={whatsappLink(whatsappMessages.general)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("whatsapp_click", { source: "fab" })}
          className="wa-cta flex min-h-14 items-center gap-2 rounded-full px-4 py-3 font-semibold shadow-lg shadow-[#1faa53]/30 hover:scale-[1.03]"
          aria-label="Chat with Medivyx on WhatsApp"
        >
          <MessageCircle aria-hidden="true" className="size-5" />
          <span className="hidden text-sm sm:inline">Chat with Medivyx</span>
          <span className="sr-only sm:hidden">Chat with Medivyx on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
