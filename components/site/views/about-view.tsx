"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Check, HeartHandshake } from "lucide-react";
import { PageHero } from "@/components/site/page-hero";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/site/reveal";
import { track } from "@/lib/analytics";

const BELIEFS = [
  {
    title: "Accessible care",
    description: "Healthcare help should be easy to reach — in person, on the phone or on WhatsApp.",
  },
  {
    title: "Professional service",
    description: "Prescriptions processed properly, questions answered honestly, every time.",
  },
  {
    title: "Convenience",
    description: "Request ahead, collect quickly. No unnecessary waiting or wasted trips.",
  },
  {
    title: "Patient-first support",
    description: "We take time to explain, because medicine only works when it's understood.",
  },
];

/** About Medivyx (research.md §13) — short, professional, no invented claims. */
export function AboutView() {
  useEffect(() => {
    track("page_view", { page: "about" });
  }, []);

  return (
    <main id="main-content">
      <PageHero
        eyebrow="About"
        title="Making everyday healthcare easier to access, understand and manage"
        description="Medivyx Medical Care provides accessible healthcare and pharmacy services for individuals and families."
      />

      <section className="bg-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <Reveal>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-primary/12 via-transparent to-honey-soft/50 blur-lg"
              />
              <div className="relative overflow-hidden rounded-[1.75rem] shadow-xl ring-1 ring-border">
                <Image
                  src="/images/about-team.webp"
                  alt="A Medivyx pharmacist warmly advising a customer at the pharmacy counter"
                  width={1152}
                  height={864}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">
                Who we are
              </h2>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                Medivyx Medical Care is a community pharmacy bringing together
                quality medicines, healthcare products and everyday medical
                support — with a team that treats customers like neighbours,
                because they are.
              </p>
              <p className="mt-4 text-base leading-8 text-muted-foreground">
                From processing prescriptions to advising on first-aid
                essentials, the goal is simple: healthcare that&apos;s closer
                to you.
              </p>
            </Reveal>

            <Reveal delay={1}>
              <h2 className="mt-10 font-display text-2xl font-semibold sm:text-3xl">
                What we believe
              </h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {BELIEFS.map((belief) => (
                  <li
                    key={belief.title}
                    className="rounded-2xl border bg-card p-5 shadow-sm"
                  >
                    <p className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check aria-hidden="true" className="size-4" />
                      </span>
                      {belief.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {belief.description}
                    </p>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="border-y bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <Reveal>
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HeartHandshake aria-hidden="true" className="size-7" />
            </span>
            <blockquote className="mx-auto mt-6 max-w-2xl font-display text-2xl font-medium leading-relaxed text-foreground sm:text-3xl">
              “Making everyday healthcare easier to access, understand and
              manage.”
            </blockquote>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Our approach
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
