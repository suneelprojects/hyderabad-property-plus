import { Link } from "@tanstack/react-router";
import {
  Building2,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";

import { Container } from "./container";
import { useLocations, useMeta, useProjects } from "@/hooks/queries";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Projects", to: "/projects" },
  { label: "Locations", to: "/locations" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
] as const;

const DEFAULT_ADDRESS = "Financial District, Hyderabad, Telangana 500032";

/**
 * Footer — four-column layout on desktop, stacked on mobile. Contact block
 * pulls from /meta; the locations column pulls from /locations (first 6).
 */
export function Footer() {
  const { data: meta } = useMeta();
  const { data: locations } = useLocations();

  const year = new Date().getFullYear();
  const socials = meta?.social ?? {};

  return (
    <footer className="mt-auto bg-[color:var(--navy)] text-white/85">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/20 bg-white/5">
                <Building2 className="h-5 w-5 text-[color:var(--gold)]" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-serif text-lg font-semibold text-white">
                  Hyderabad Realty Choices
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)]">
                  Luxury Homes · Trusted Choices
                </span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/70">
              Connecting buyers with verified residential projects across
              Hyderabad through trust, transparency, and expert guidance.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-4 font-serif text-base font-semibold text-white">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-white/70 transition-colors hover:text-[color:var(--gold)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="mb-4 font-serif text-base font-semibold text-white">
              Popular Locations
            </h4>
            <ul className="flex flex-col gap-2 text-sm">
              {(locations ?? []).slice(0, 6).map((loc) => (
                <li key={loc.id}>
                  <Link
                    to="/location/$slug"
                    params={{ slug: loc.slug }}
                    className="text-white/70 transition-colors hover:text-[color:var(--gold)]"
                  >
                    {loc.title}
                  </Link>
                </li>
              ))}
              {!locations?.length
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li
                      key={i}
                      className="h-4 w-32 animate-pulse rounded bg-white/10"
                    />
                  ))
                : null}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-serif text-base font-semibold text-white">
              Get in Touch
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              {meta?.phone ? (
                <li>
                  <a
                    href={`tel:${meta.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-3 text-white/80 hover:text-[color:var(--gold)]"
                  >
                    <Phone className="h-4 w-4 text-[color:var(--gold)]" />
                    {meta.phone}
                  </a>
                </li>
              ) : null}
              {meta?.email ? (
                <li>
                  <a
                    href={`mailto:${meta.email}`}
                    className="flex items-center gap-3 text-white/80 hover:text-[color:var(--gold)]"
                  >
                    <Mail className="h-4 w-4 text-[color:var(--gold)]" />
                    {meta.email}
                  </a>
                </li>
              ) : null}
              {meta?.address ? (
                <li className="flex items-start gap-3 text-white/80">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--gold)]" />
                  <span>{meta.address}</span>
                </li>
              ) : null}
            </ul>

            <div className="mt-5 flex items-center gap-2">
              {socials.facebook ? (
                <SocialLink href={socials.facebook} label="Facebook">
                  <Facebook className="h-4 w-4" />
                </SocialLink>
              ) : null}
              {socials.instagram ? (
                <SocialLink href={socials.instagram} label="Instagram">
                  <Instagram className="h-4 w-4" />
                </SocialLink>
              ) : null}
              {socials.twitter ? (
                <SocialLink href={socials.twitter} label="Twitter">
                  <Twitter className="h-4 w-4" />
                </SocialLink>
              ) : null}
              {socials.youtube ? (
                <SocialLink href={socials.youtube} label="YouTube">
                  <Youtube className="h-4 w-4" />
                </SocialLink>
              ) : null}
              {socials.linkedin ? (
                <SocialLink href={socials.linkedin} label="LinkedIn">
                  <Linkedin className="h-4 w-4" />
                </SocialLink>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 py-6 text-xs text-white/60 sm:flex-row sm:items-center">
          <p>© {year} Hyderabad Realty Choices. All rights reserved.</p>
          <p>
            <span className="text-white/50">Made with care in Hyderabad</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 transition-colors hover:border-[color:var(--gold)] hover:bg-[color:var(--gold)] hover:text-[color:var(--navy)]"
    >
      {children}
    </a>
  );
}
