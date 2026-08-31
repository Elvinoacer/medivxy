"use client";

import { useEffect } from "react";
import {
  ClipboardCheck,
  FileUp,
  MessageCircle,
  Phone,
  Pill,
  ShieldCheck,
  Truck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { useLanguage } from "@/components/site/language-provider";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { SiteLink } from "@/components/site/link";
import { business, whatsappLink, whatsappMessages } from "@/lib/business";
import { track } from "@/lib/analytics";

const WORKFLOW = [
  {
    icon: FileUp,
    title: "Submit your prescription",
    description:
      "Upload a photo or PDF on the Request Medicine page — or bring it to the counter.",
  },
  {
    icon: ClipboardCheck,
    title: "The team reviews it",
    description:
      "A pharmacist checks the prescription is valid and everything is appropriate.",
  },
  {
    icon: Phone,
    title: "We confirm with you",
    description:
      "You get a message on WhatsApp or a call to confirm items, timing and any questions.",
  },
  {
    icon: Truck,
    title: "Pickup or delivery",
    description:
      "Collect at the pharmacy, or ask about delivery availability for your area.",
  },
];

const SAFETY_POINTS = [
  "Prescription medicines dispensed only against valid prescriptions",
  "Antibiotics never sold over the counter",
  "Pharmacist checks each prescription before dispensing",
  "Guidance on how to take your medicine, in plain language",
];

/** Pharmacy page — prescription workflow + safety commitment. */
export function PharmacyView() {
  const { t } = useLanguage();
  useEffect(() => {
    track("page_view", { page: "pharmacy" });
  }, []);

  return (
    <main id="main-content">
      <PageHero
        eyebrow={t("page.pharmacy.eyebrow")}
        title={t("page.pharmacy.title")}
        description={t("page.pharmacy.desc")}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-6">
            <SiteLink href="/request-medicine" trackLabel="pharmacy-request">
              <FileUp aria-hidden="true" className="size-4.5" />
              Submit a Prescription
            </SiteLink>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <a
              href={whatsappLink(whatsappMessages.prescription)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "pharmacy-hero" })}
            >
              <MessageCircle aria-hidden="true" className="size-4.5" />
              Ask on WhatsApp
            </a>
          </Button>
        </div>
      </PageHero>

      {/* How it works */}
      <section aria-labelledby="workflow-heading" className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SectionHeading
            eyebrow="How it works"
            titleId="workflow-heading"
            title="From prescription to collection in four steps"
            description="Simple, transparent, and always confirmed with you first."
          />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((step, i) => (
              <Reveal as="li" key={step.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <div className="relative h-full rounded-2xl border bg-card p-6 shadow-sm">
                  <span
                    aria-hidden="true"
                    className="absolute -top-3 left-6 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-bold text-background"
                  >
                    Step {i + 1}
                  </span>
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <step.icon aria-hidden="true" className="size-6" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Safety */}
      <section aria-labelledby="safety-heading" className="border-y bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-background/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-background/80">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Safety first
              </p>
              <h2
                id="safety-heading"
                className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                The rules we don&apos;t bend
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-background/70">
                Antibiotics and other prescription medicines are dispensed
                only against valid prescriptions — that&apos;s how pharmacy
                should work, and how we keep the community safe.
              </p>
            </Reveal>
          </div>
          <Reveal delay={1}>
            <ul className="space-y-3">
              {SAFETY_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-background/15 bg-background/5 p-4"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check aria-hidden="true" className="size-3.5" />
                  </span>
                  <span className="text-sm leading-6 text-background/85">{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Pharmacist CTA */}
      <section className="bg-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Reveal>
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Pill aria-hidden="true" className="size-7" />
            </span>
            <h2 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">
              Have a question about your medicine?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              The pharmacist can explain how and when to take it, what to
              avoid, and what to expect. No appointment needed.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full px-7">
                <a
                  href={whatsappLink("Hi Medivyx, I have a question about my medicine.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("whatsapp_click", { source: "pharmacy-cta" })}
                >
                  <MessageCircle aria-hidden="true" className="size-4.5" />
                  Ask the Pharmacist
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <a href={business.phoneHref} onClick={() => track("call_click", { source: "pharmacy-cta" })}>
                  <Phone aria-hidden="true" className="size-4.5" />
                  {business.phone}
                </a>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
