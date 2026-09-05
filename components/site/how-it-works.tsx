"use client";

import Image from "next/image";
import { ArrowRight, MessageCircle, Package, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteLink } from "@/components/site/link";
import { Reveal } from "@/components/site/reveal";

/**
 * "From basket to doorstep" — explains the shop flow visually so first-time
 * buyers know exactly what happens after they add to basket (and that Rx
 * items pass the pharmacist first).
 */
const STEPS = [
  {
    icon: ShoppingCart,
    title: "1 · Fill your basket",
    desc: "Browse the shop, add what you need and choose pickup or same-day delivery.",
  },
  {
    icon: ShieldCheck,
    title: "2 · We review & confirm",
    desc: "Prescriptions go to the pharmacist. The team confirms items and your total on WhatsApp.",
  },
  {
    icon: Truck,
    title: "3 · Collect or receive",
    desc: "Pick it up in Roysambu — ready in about an hour — or get it delivered to your door.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="bg-card/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <SectionHeading
          eyebrow="Ordering online"
          titleId="how-heading"
          title="From basket to doorstep, in three steps"
          description="Buying health essentials from Medivyx is designed to feel as easy as messaging a friend — with a pharmacist's care built in."
        />

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[1.05fr_1fr]">
          {/* Visual: delivery photo with overlay card */}
          <Reveal className="relative min-h-[280px] overflow-hidden rounded-3xl shadow-md">
            <Image
              src="/images/service-delivery.webp"
              alt="A Medivyx courier handing a medicine package to a customer at her door"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent"
            />
            <div className="absolute bottom-0 p-6 sm:p-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <Package aria-hidden="true" className="size-4.5" />
                Same-day delivery around Nairobi
              </p>
              <p className="mt-1.5 max-w-sm text-sm leading-6 text-white/85">
                Roysambu and nearby estates — fee confirmed by the team before
                dispatch, so there are no surprises.
              </p>
              <SiteLink
                href="/products"
                trackLabel="how-it-works-shop"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-foreground shadow-lg transition-all hover:gap-3.5"
              >
                Start an order
                <ArrowRight aria-hidden="true" className="size-4" />
              </SiteLink>
            </div>
          </Reveal>

          {/* Steps */}
          <ol className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.title} delay={(i + 1) as 1 | 2 | 3} className="flex-1">
                <div className="group flex h-full items-start gap-4 rounded-2xl border bg-background p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/8">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <step.icon aria-hidden="true" className="size-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal as="li" delay={4}>
              <p className="flex items-center gap-2.5 rounded-2xl bg-honey-soft/60 p-4 text-sm leading-6 text-accent-foreground">
                <MessageCircle aria-hidden="true" className="size-5 shrink-0" />
                Prefer to just ask? Message the team on WhatsApp — they&rsquo;ll
                build your order for you.
              </p>
            </Reveal>
          </ol>
        </div>
      </div>
    </section>
  );
}
