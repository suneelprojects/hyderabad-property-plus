import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useEnquiry } from "@/components/enquiry-modal";
import { useMeta } from "@/hooks/queries";

/**
 * ContactCta — the closing "Let's find your address in Hyderabad" section.
 * Left column: contact info from /meta. Right column: luxury card that
 * opens the global enquiry modal.
 */
export function ContactCta() {
  const { data: meta } = useMeta();
  const { open: openEnquiry } = useEnquiry();

  const address =
    meta?.address ?? "Financial District, Hyderabad, Telangana 500032";
  const contactEmail = meta?.email ?? "contact@hyderabadrealtychoices.com";
  const contactPhone = meta?.phone ?? "+91 90000 00000";

  return (
    <Section id="contact" alt>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left */}
        <div className="flex flex-col gap-6">
          <Eyebrow>Talk to us</Eyebrow>
          <h2 className="font-serif text-3xl font-semibold leading-tight text-[color:var(--navy)] md:text-[40px]">
            Let&rsquo;s find your address in Hyderabad.
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
            Share a few details and a senior advisor will reach out within one
            business hour.
          </p>

          <ul className="mt-2 flex flex-col gap-4 text-[15px]">
            <li>
              <a
                href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                className="flex items-center gap-3 text-[color:var(--navy)] hover:text-[color:var(--gold-2)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                  <Phone className="h-4 w-4" />
                </span>
                {contactPhone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 text-[color:var(--navy)] hover:text-[color:var(--gold-2)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                  <Mail className="h-4 w-4" />
                </span>
                {contactEmail}
              </a>
            </li>
            <li className="flex items-center gap-3 text-[color:var(--navy)]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                <MapPin className="h-4 w-4" />
              </span>
              {address}
            </li>
          </ul>
        </div>

        {/* Right — CTA card */}
        <div className="rounded-[var(--radius)] bg-white p-8 shadow-[var(--shadow-soft)] md:p-10">
          <h3 className="font-serif text-2xl font-semibold text-[color:var(--navy)]">
            Enquire Now
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            A senior advisor will reach out within 1 business hour. Zero
            brokerage. RERA-compliant.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              type="button"
              variant="gold"
              size="lg"
              className="rounded-full"
              onClick={() => openEnquiry()}
            >
              Start your enquiry
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="rounded-full"
              onClick={() => openEnquiry()}
            >
              Book a Site Visit
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
