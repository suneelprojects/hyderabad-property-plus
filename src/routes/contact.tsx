import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Clock,
  Crown,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { useEnquiry } from "@/components/enquiry-modal";
import { useMeta } from "@/hooks/queries";
import { WhatsAppIcon } from "@/components/projects/project-cards";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Hyderabad Realty Choices" },
      {
        name: "description",
        content:
          "Speak with a senior advisor at Hyderabad Realty Choices. Call, WhatsApp, email or visit our office in Hyderabad.",
      },
      { property: "og:title", content: "Contact — Hyderabad Realty Choices" },
      {
        property: "og:description",
        content:
          "Get in touch for site visits, brochures or curated home shortlists across Hyderabad.",
      },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { open } = useEnquiry();
  const { data: meta } = useMeta();

  const phone = meta?.phone || "+91 90000 00000";
  const whatsapp = meta?.whatsapp || meta?.phone || "";
  const email = meta?.email || "hello@hyderabadrealtychoices.com";
  const address = meta?.address || "Financial District, Hyderabad, Telangana 500032";
  const hours = "Mon – Sat · 9:30 AM – 7:30 PM";

  const waNumber = whatsapp.replace(/\D/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hi, I'd like to speak with an advisor.")}`
    : undefined;
  const telHref = `tel:${phone.replace(/\s+/g, "")}`;

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[color:var(--navy)] text-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[color:var(--navy)] via-[#0d264f] to-[color:var(--navy)]" />
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)] backdrop-blur-sm">
            <Crown className="h-3.5 w-3.5" />
            Talk to an advisor
          </span>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-[1.1] md:text-6xl">
            Let's find your next home together.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/75 md:text-lg">
            Reach us by call, WhatsApp or email — or share a brief and we'll come back with a
            curated shortlist within 24 hours.
          </p>
        </div>
      </section>

      {/* Contact cards + map */}
      <Section className="bg-[color:var(--ivory)]">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div className="grid gap-5 sm:grid-cols-2">
            <ContactCard icon={<Phone className="h-5 w-5" />} label="Call" value={phone} href={telHref} />
            <ContactCard
              icon={<MessageCircle className="h-5 w-5" />}
              label="WhatsApp"
              value={whatsapp || "Chat with us"}
              href={waHref}
              external
            />
            <ContactCard icon={<Mail className="h-5 w-5" />} label="Email" value={email} href={`mailto:${email}`} />
            <ContactCard icon={<Clock className="h-5 w-5" />} label="Hours" value={hours} />
            <div className="sm:col-span-2">
              <ContactCard icon={<MapPin className="h-5 w-5" />} label="Office" value={address} />
            </div>
          </div>

          {/* Map placeholder */}
          <div className="overflow-hidden rounded-[24px] border border-[color:var(--gold)]/15 bg-white shadow-[var(--shadow-soft)]">
            <div className="relative aspect-[4/3] w-full bg-[color:var(--mist)]">
              <iframe
                title="Hyderabad Realty Choices office location"
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold-2)]">
                  Visit Us
                </p>
                <p className="mt-1 font-serif text-lg font-semibold text-[color:var(--navy)]">
                  {address}
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get directions
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA block */}
      <Section>
        <SectionHeading
          eyebrow="Enquiry Form"
          title="Share a brief — we'll take it from here"
          subtitle="Tell us what you're looking for and one of our advisors will curate a shortlist within 24 hours."
        />
        <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-[28px] border border-[color:var(--gold)]/20 bg-white p-10 text-center shadow-[var(--shadow-lift)]">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--gold)]/10 text-[color:var(--gold-2)]">
            <Crown className="h-6 w-6" />
          </span>
          <h3 className="mt-6 font-serif text-2xl font-semibold text-[color:var(--navy)] md:text-3xl">
            Start your enquiry
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            The form opens in a quick popup — takes under 60 seconds.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={() => open()}>
              <Calendar className="h-4 w-4" />
              Start your enquiry
            </Button>
            {waHref ? (
              <Button asChild size="lg" className="bg-[#25D366] text-white hover:bg-[#20b558]">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp us
                </a>
              </Button>
            ) : null}
            <Button asChild size="lg" variant="outline">
              <a href={telHref}>
                <Phone className="h-4 w-4" />
                Call {phone}
              </a>
            </Button>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <div className="flex items-start gap-4">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--gold)]/10 text-[color:var(--gold-2)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold-2)]">
          {label}
        </p>
        <p className="mt-1 truncate font-serif text-lg font-semibold text-[color:var(--navy)]">
          {value}
        </p>
      </div>
    </div>
  );

  const cls =
    "block rounded-[20px] border border-black/[0.04] bg-white p-6 shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]";

  if (!href) return <div className={cls}>{body}</div>;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cls}
    >
      {body}
    </a>
  );
}
