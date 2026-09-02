"use client";

import { Phone, MessageCircle, Navigation, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { business, whatsappLink, whatsappMessages, hoursForDate } from "@/lib/business";
import { useOpenStatus } from "@/lib/open-status";
import { track } from "@/lib/analytics";

/** Stylised local map (no API key needed — replace with an embedded map later). */
function StylizedMap() {
  return (
    <div
      role="img"
      aria-label={`Stylised map showing ${business.name} in ${business.area}, ${business.city}`}
      className="relative h-44 overflow-hidden rounded-xl bg-mint/60 sm:h-52"
    >
      <svg
        viewBox="0 0 400 200"
        className="absolute inset-0 size-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* roads */}
        <g stroke="oklch(0.93 0.01 100)" strokeWidth="10" strokeLinecap="round">
          <path d="M-10 60 H410" />
          <path d="M-10 140 H410" />
          <path d="M90 -10 V210" />
          <path d="M300 -10 V210" />
        </g>
        <g stroke="white" strokeWidth="4" strokeLinecap="round">
          <path d="M-10 60 H410" />
          <path d="M-10 140 H410" />
          <path d="M90 -10 V210" />
          <path d="M300 -10 V210" />
          <path d="M-10 100 H80" strokeDasharray="1 10" strokeWidth="2.5" />
        </g>
        {/* green spaces */}
        <circle cx="180" cy="40" r="26" fill="oklch(0.9 0.05 150)" />
        <circle cx="350" cy="170" r="34" fill="oklch(0.9 0.05 150)" />
        <rect x="110" y="160" width="60" height="30" rx="6" fill="oklch(0.92 0.04 85)" />
        {/* blocks */}
        <g fill="oklch(0.97 0.005 100)" stroke="oklch(0.9 0.01 100)" strokeWidth="1.5">
          <rect x="115" y="80" width="60" height="38" rx="4" />
          <rect x="200" y="80" width="80" height="38" rx="4" />
          <rect x="115" y="128" width="60" height="0" rx="4" />
        </g>
        {/* label */}
        <text x="222" y="105" fontSize="8" fill="oklch(0.5 0.02 165)" textAnchor="middle">
          {business.area}
        </text>
      </svg>
      {/* Pin */}
      <div className="absolute left-[57%] top-[38%] -translate-x-1/2 -translate-y-full">
        <div className="relative flex flex-col items-center">
          <span className="absolute -bottom-2 size-8 animate-ping rounded-full bg-primary/25" />
          <span className="relative flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 ring-4 ring-white">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
            </svg>
          </span>
        </div>
      </div>
      <span className="absolute bottom-2 left-2 rounded-full bg-card/90 px-2.5 py-1 text-[0.625rem] font-medium text-muted-foreground shadow-sm">
        Roysambu, Nairobi
      </span>
    </div>
  );
}

/** Location experience (research.md §12). */
export function LocationCard() {
  // Day-of-week from a fixed render-time Date is stable across server/client,
  // so it can never hydration-mismatch; live Open/Closed comes from the hook.
  const today = hoursForDate(new Date());
  const status = useOpenStatus();

  return (
    <Reveal>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="p-5 sm:p-6">
          <StylizedMap />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {business.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {business.area}, {business.city}
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-mint-foreground">
                <span className="relative flex size-2">
                  <span
                    className={`absolute inline-flex size-full animate-ping rounded-full opacity-50 ${
                      status.ready && status.open ? "bg-emerald-500" : "bg-transparent"
                    }`}
                  />
                  <span
                    className={`relative inline-flex size-2 rounded-full ${
                      status.ready ? (status.open ? "bg-emerald-600" : "bg-amber-600") : "bg-muted-foreground/40"
                    }`}
                  />
                </span>
                {status.ready
                  ? `${status.open ? "Open now" : "Closed now"} · ${today.open} – ${today.close}`
                  : `Open today · ${today.open} – ${today.close}`}
              </p>
            </div>
            <ul className="text-xs text-muted-foreground">
              {business.hours.map((h) => (
                <li key={h.day} className="flex items-center gap-2 py-0.5">
                  <Clock aria-hidden="true" className="size-3" />
                  <span>
                    {h.day}: {h.open} – {h.close}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <Button asChild className="flex-1 rounded-full">
              <a
                href={business.mapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("directions_click", { source: "location-card" })}
              >
                <Navigation aria-hidden="true" className="size-4" />
                Get Directions
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-full">
              <a href={business.phoneHref} onClick={() => track("call_click", { source: "location-card" })}>
                <Phone aria-hidden="true" className="size-4" />
                Call
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1 rounded-full">
              <a
                href={whatsappLink(whatsappMessages.directions)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { source: "location-card" })}
              >
                <MessageCircle aria-hidden="true" className="size-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
