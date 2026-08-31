import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";
import { whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";

/** Conversion band: the funnel's final push to WhatsApp (research.md §31). */
export function CtaBand() {
  return (
    <section aria-labelledby="cta-heading" className="relative overflow-hidden bg-primary">
      <div
        aria-hidden="true"
        className="absolute -top-24 right-10 size-72 rounded-full bg-white/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-28 -left-10 size-72 rounded-full bg-honey/20 blur-2xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <Reveal>
          <h2
            id="cta-heading"
            className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl"
          >
            Need medicine, advice or a refill?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-primary-foreground/85 sm:text-lg">
            Message the Medivyx team on WhatsApp — quick answers, honest
            guidance and your medicine prepared before you arrive.
          </p>
        </Reveal>
        <Reveal delay={1}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white px-7 text-base text-primary shadow-lg hover:bg-white/90"
            >
              <a
                href={whatsappLink(whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("whatsapp_click", { source: "cta-band" })}
              >
                <MessageCircle aria-hidden="true" className="size-4.5" />
                Chat on WhatsApp
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-transparent px-7 text-base text-primary-foreground hover:bg-white/10 hover:text-white"
            >
              <SiteLink href="/request-medicine" trackLabel="cta-request">
                Request Medicine
                <ArrowRight aria-hidden="true" className="size-4.5" />
              </SiteLink>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
