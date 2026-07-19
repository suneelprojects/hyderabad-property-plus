import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  Compass,
  Crown,
  Handshake,
  HeartHandshake,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { useEnquiry } from "@/components/enquiry-modal";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Hyderabad Realty Choices" },
      {
        name: "description",
        content:
          "Hyderabad Realty Choices connects discerning buyers with the city's most trusted residential developments through transparency, insight and personal service.",
      },
      { property: "og:title", content: "About — Hyderabad Realty Choices" },
      {
        property: "og:description",
        content:
          "Learn our story, vision, mission and the buying journey behind Hyderabad's most curated luxury property advisory.",
      },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: ShieldCheck, title: "Integrity", copy: "Verified inventory. Transparent pricing. No hidden layers." },
  { icon: Crown, title: "Curation", copy: "Only projects that meet our design, build and location standards." },
  { icon: Handshake, title: "Advisory", copy: "Consultative guidance from first tour to final registration." },
  { icon: HeartHandshake, title: "Care", copy: "A relationship that extends far beyond the transaction." },
];

const TRUST = [
  { icon: BadgeCheck, title: "RERA-verified listings", copy: "Every project is validated for approvals, titles and delivery track record." },
  { icon: Star, title: "Handpicked portfolio", copy: "Curated homes across Financial District, Kokapet, Tellapur, Narsingi and more." },
  { icon: Users, title: "500+ families placed", copy: "A trusted network of buyers, NRIs and long-term investors across Hyderabad." },
  { icon: Award, title: "Builder partnerships", copy: "Direct relationships with the city's most reputed developers." },
];

const SERVICES = [
  { icon: Home, title: "Home Discovery", copy: "Personalised shortlists based on lifestyle, budget and future goals." },
  { icon: MapPin, title: "Site Visits", copy: "Chauffeured tours across ready and under-construction inventory." },
  { icon: Building2, title: "Investment Advisory", copy: "Yield, appreciation and rental analysis for informed decisions." },
  { icon: Sparkles, title: "Post-sale Support", copy: "Paperwork, registration, handover and interior partner referrals." },
];

const JOURNEY = [
  { step: "01", title: "Discovery Call", copy: "We understand your lifestyle, family plans and financial parameters." },
  { step: "02", title: "Curated Shortlist", copy: "A tailored set of 3–5 projects that match your brief precisely." },
  { step: "03", title: "Site Visits", copy: "Walk through the inventory with our advisors, no builder pressure." },
  { step: "04", title: "Negotiation", copy: "We secure the best price, floor and payment plan on your behalf." },
  { step: "05", title: "Paperwork & Handover", copy: "End-to-end assistance through registration and possession." },
];

function AboutPage() {
  const { open } = useEnquiry();

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[color:var(--navy)] text-white">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[color:var(--navy)]/85 via-[color:var(--navy)]/75 to-[color:var(--navy)]" />
        <div className="mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)] backdrop-blur-sm">
            <Crown className="h-3.5 w-3.5" />
            About Hyderabad Realty Choices
          </span>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.1] md:text-6xl">
            A quieter way to find a great home in Hyderabad.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
            We're a boutique property advisory built around one belief — that buying a home
            should feel considered, unhurried and informed. Not sold.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <Section className="bg-[color:var(--ivory)]">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Our Story"
              title="Built on trust, curated with care"
              align="left"
            />
            <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Hyderabad Realty Choices began with a simple frustration — the city's most
                exciting residential projects were being sold like commodities. Long forms,
                cold calls, and one-size-fits-all pitches.
              </p>
              <p>
                We built a different practice: a small team of advisors who spend time with
                each family, verify every project, and walk buyers through the entire
                journey — from first site visit to the day the keys are handed over.
              </p>
              <p>
                Today we work across Hyderabad's most sought-after corridors — Financial
                District, Kokapet, Tellapur, Narsingi, Gachibowli and beyond — placing
                families in homes they'll be proud of for decades.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[24px] shadow-[var(--shadow-lift)]">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80"
              alt="Modern residential tower in Hyderabad"
              className="aspect-[4/5] h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </Section>

      {/* Vision + Mission */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            {
              icon: Compass,
              tag: "Vision",
              title: "To be Hyderabad's most trusted residential advisory.",
              copy: "A practice defined by taste, discretion and the long-term wellbeing of every family we work with.",
            },
            {
              icon: Target,
              tag: "Mission",
              title: "Match every buyer with a home that truly fits.",
              copy: "Through verified inventory, honest counsel and personal service — from first conversation to final handover.",
            },
          ].map((b) => (
            <article
              key={b.tag}
              className="rounded-[24px] border border-[color:var(--gold)]/15 bg-white p-10 shadow-[var(--shadow-soft)]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--gold)]/10 text-[color:var(--gold-2)]">
                <b.icon className="h-5 w-5" />
              </span>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold-2)]">
                {b.tag}
              </p>
              <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-[color:var(--navy)]">
                {b.title}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{b.copy}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Core Values */}
      <Section className="bg-[color:var(--ivory)]">
        <SectionHeading
          eyebrow="Core Values"
          title="The principles behind every recommendation"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-[20px] border border-black/[0.04] bg-white p-7 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--navy)] text-[color:var(--gold)]">
                <v.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-serif text-lg font-semibold text-[color:var(--navy)]">
                {v.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.copy}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Trust */}
      <Section>
        <SectionHeading
          eyebrow="Why Buyers Trust Us"
          title="A practice, not a brokerage"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {TRUST.map((t) => (
            <div
              key={t.title}
              className="flex gap-5 rounded-[20px] border border-[color:var(--gold)]/15 bg-white p-7 shadow-[var(--shadow-soft)]"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--gold)]/10 text-[color:var(--gold-2)]">
                <t.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[color:var(--navy)]">
                  {t.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.copy}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Services */}
      <Section className="bg-[color:var(--ivory)]">
        <SectionHeading eyebrow="Our Services" title="How we work with you" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-[20px] bg-white p-7 shadow-[var(--shadow-soft)]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--navy)] text-[color:var(--gold)]">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-serif text-lg font-semibold text-[color:var(--navy)]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.copy}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Journey */}
      <Section>
        <SectionHeading eyebrow="Buying Journey" title="From first call to final keys" />
        <ol className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {JOURNEY.map((j) => (
            <li
              key={j.step}
              className="relative rounded-[20px] border border-[color:var(--gold)]/15 bg-white p-7 shadow-[var(--shadow-soft)]"
            >
              <span className="font-serif text-2xl font-semibold text-[color:var(--gold-2)]">
                {j.step}
              </span>
              <h3 className="mt-3 font-serif text-lg font-semibold text-[color:var(--navy)]">
                {j.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{j.copy}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* CTA */}
      <Section className="bg-[color:var(--navy)] text-white">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
            <Crown className="h-3.5 w-3.5" />
            Talk to an advisor
          </span>
          <h2 className="mt-6 font-serif text-3xl font-semibold leading-tight md:text-5xl">
            Ready to find a home you'll love for decades?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/70">
            Share a brief and one of our senior advisors will curate a shortlist within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => open()} className="bg-[color:var(--gold)] text-[color:var(--navy)] hover:bg-[color:var(--gold-2)]">
              Start your enquiry
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
              <Link to="/projects">Explore projects</Link>
            </Button>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
