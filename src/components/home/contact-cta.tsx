import { useState } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useMeta } from "@/hooks/queries";

/**
 * ContactCta — the "Talk to us / Let's find your address in Hyderabad"
 * closing section. Left column shows contact info from /meta; right column
 * is a lightweight enquiry form (client-side only — submits to mailto for now).
 */
export function ContactCta() {
  const { data: meta } = useMeta();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });

  const address =
    meta?.address ?? "Financial District, Hyderabad, Telangana 500032";
  const contactEmail = meta?.email ?? "contact@hyderabadrealtychoices.com";
  const contactPhone = meta?.phone ?? "+91 90000 00000";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Enquiry from ${form.name || "website"}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email}\n\nMessage:\n${form.message}`,
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

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

        {/* Right — form card */}
        <form
          onSubmit={onSubmit}
          className="rounded-[var(--radius)] bg-white p-6 shadow-[var(--shadow-soft)] md:p-8"
        >
          <h3 className="font-serif text-2xl font-semibold text-[color:var(--navy)]">
            Enquire Now
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A senior advisor will reach out within 1 business hour.
          </p>

          <div className="mt-6 flex flex-col gap-4">
            <FormField
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              required
            />
            <FormField
              label="Mobile Number"
              type="tel"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              required
            />
            <FormField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              required
            />
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--gold-2)]">
                Message (optional)
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Tell us what you are looking for…"
                className="hrc-input"
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="mt-2 rounded-full"
            >
              Submit
              <ArrowRight className="h-4 w-4" />
            </Button>

            {submitted ? (
              <p className="text-sm text-[color:var(--gold-2)]">
                Thanks! Your email client should open with the enquiry
                pre-filled.
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </Section>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--gold-2)]">
        {label}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="hrc-input"
      />
    </div>
  );
}
