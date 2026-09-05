"use client";

import { useState } from "react";
import { Phone, MessageCircle, Navigation, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { business, whatsappLink, whatsappMessages, hoursForDate } from "@/lib/business";
import { useOpenStatus } from "@/lib/open-status";
import { track } from "@/lib/analytics";

/** Live embedded map (no API key required) with a graceful loading state
 *  and a storefront photo fallback. If the embed can't load (offline demo),
 *  the photo + directions buttons still work. */
function EmbeddedMap() {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const { lat, lng } = business.mapCoordinates;
  const src = `https://www.google.com/maps?q=${lat},${lng}(${encodeURIComponent(
    `${business.name}, ${business.area}`
  )})&z=15&output=embed`;

  return (
    <div className="relative h-52 overflow-hidden rounded-xl bg-mint/50 sm:h-64">
      {!failed && (
        <iframe
          title={`Map showing ${business.name} in ${business.area}, ${business.city}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full border-0"
          allowFullScreen
        />
      )}
      {failed && (
        /* eslint-disable-next-line @next/next/no-img-element -- fallback only renders when the map iframe fails (offline demo) */
        <img
          src="/images/storefront.webp"
          alt={`${business.name} storefront in ${business.area}`}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {!loaded && !failed && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-primary">
          <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          <p className="text-xs font-medium">Loading map…</p>
        </div>
      )}
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
          <EmbeddedMap />
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
