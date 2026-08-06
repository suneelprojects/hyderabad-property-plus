import { Link } from "@tanstack/react-router";
import {
  BedDouble,
  Calendar,
  Camera,
  CheckCircle2,
  Crown,
  Download,
  Eye,
  MapPin,
  Ruler,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEnquiry } from "@/components/enquiry-modal";
import { decodeEntities } from "@/lib/html";
import type { Project } from "@/types/hrc";
import { SALES_WHATSAPP_NUMBER } from "@/lib/whatsapp";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80";

export function projectImage(p: Project): string {
  if (typeof p.featured_image === "string" && p.featured_image)
    return p.featured_image;
  if (p.gallery?.length) return p.gallery[0];
  return FALLBACK_IMG;
}

export function priceLabel(p: Project): string {
  if (!p.price_from) return "On Request";
  if (typeof p.price_from === "number") return `₹ ${p.price_from}`;
  const s = String(p.price_from).trim();
  return /^[₹$]/.test(s) ? s : `₹ ${s}`;
}

function locationTitle(p: Project): string | undefined {
  const t = p.location?.title;
  return t ? decodeEntities(t) : undefined;
}

function projectTitle(p: Project): string {
  return decodeEntities(p.title ?? "");
}

function statusTone(status?: string): {
  label: string;
  className: string;
} | null {
  if (!status) return null;
  const s = status.toLowerCase();
  if (/(ready|move|possess)/.test(s))
    return {
      label: "Ready to Move",
      className: "bg-emerald-500/95 text-white",
    };
  if (/(ongo|constr|launch|new)/.test(s))
    return {
      label: status,
      className: "bg-white/95 text-[color:var(--navy)]",
    };
  return { label: status, className: "bg-white/95 text-[color:var(--navy)]" };
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.52 3.48A11.79 11.79 0 0 0 12.06 0C5.5 0 .17 5.33.17 11.89c0 2.09.55 4.14 1.6 5.94L0 24l6.34-1.66a11.86 11.86 0 0 0 5.7 1.45h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.17-1.24-6.16-3.42-8.42Zm-8.46 18.3h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.76.99 1-3.67-.23-.38a9.86 9.86 0 0 1-1.51-5.24c0-5.46 4.45-9.91 9.9-9.91 2.64 0 5.13 1.03 7 2.9a9.85 9.85 0 0 1 2.91 7c0 5.46-4.45 9.9-9.9 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.08 3.17 5.03 4.44.7.3 1.25.48 1.68.62.71.23 1.35.2 1.86.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function waLink(project: Project, whatsapp?: string): string | undefined {
  const waNumber = (whatsapp ?? "").replace(/\D/g, "") || SALES_WHATSAPP_NUMBER;
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hi, I am interested in ${projectTitle(project)}. Please share details.`,
  )}`;
}

/**
 * ProjectRow — premium horizontal card. Compact layout: image left,
 * details right with tighter spacing, single-row CTA (View / Brochure /
 * WhatsApp icon), no amenities block, 2-line description, up to 4 chips.
 */
export function ProjectRow({
  project,
  whatsapp,
}: {
  project: Project;
  whatsapp?: string;
}) {
  const { open: openEnquiry } = useEnquiry();
  const waHref = waLink(project, whatsapp);

  const status = statusTone(project.status);
  const photos = project.gallery?.length ?? 0;
  const highlights = buildHighlights(project).slice(0, 4);
  const locTitle = locationTitle(project);
  const title = projectTitle(project);

  return (
    <article className="group relative overflow-hidden rounded-[24px] border border-black/[0.04] bg-white shadow-[0_1px_2px_rgba(10,31,68,.04),0_20px_50px_-30px_rgba(10,31,68,.18)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(10,31,68,.04),0_30px_70px_-30px_rgba(10,31,68,.28)]">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* IMAGE */}
        <div className="relative overflow-hidden bg-[color:var(--mist)]/40 lg:min-h-[360px]">
          <div className="aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
            <img
              src={projectImage(project)}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--navy)]/55 via-transparent to-transparent" />

          {/* Floating badges */}
          <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap items-start gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--navy)]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)] backdrop-blur-sm">
              <Crown className="h-3 w-3" />
              Luxury Collection
            </span>
            {project.featured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--gold)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--navy)]">
                Featured
              </span>
            ) : null}
            {status ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm ${status.className}`}
              >
                {status.label}
              </span>
            ) : null}
          </div>

          {photos > 0 ? (
            <div className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              <Camera className="h-3.5 w-3.5" />
              {photos} Photos
            </div>
          ) : null}

          {locTitle ? (
            <div className="pointer-events-none absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[color:var(--navy)]">
              <MapPin className="h-3.5 w-3.5 text-[color:var(--gold-2)]" />
              {locTitle}
            </div>
          ) : null}
        </div>

        {/* DETAILS */}
        <div className="flex flex-col gap-4 p-6 md:p-7">
          <header className="flex flex-col gap-2">
            {project.builder ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold-2)]">
                By {project.builder}
              </span>
            ) : null}
            <h3 className="font-serif text-[24px] font-semibold leading-[1.15] text-[color:var(--navy)] md:text-[28px]">
              {title}
            </h3>
            {locTitle ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
                {locTitle}, Hyderabad
              </p>
            ) : null}
            {project.excerpt ? (
              <p className="line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">
                {decodeEntities(project.excerpt)}
              </p>
            ) : null}
          </header>

          {highlights.length ? (
            <div className="flex flex-wrap gap-1.5">
              {highlights.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--ivory)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--navy)]"
                >
                  <CheckCircle2 className="h-3 w-3 text-[color:var(--gold-2)]" />
                  {h}
                </span>
              ))}
            </div>
          ) : null}

          {/* Price / config / possession — compact single row */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-[color:var(--gold)]/15 bg-gradient-to-br from-[color:var(--ivory)] to-white px-4 py-3">
            <FactCell
              label="Starting From"
              value={priceLabel(project)}
              accent
            />
            <FactCell
              icon={<BedDouble className="h-3.5 w-3.5" />}
              label="Config"
              value={project.unit_types || "—"}
            />
            <FactCell
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Possession"
              value={project.possession || "On Request"}
            />
          </div>

          {/* CTAs — single compact row */}
          <div className="mt-auto flex items-center gap-2 pt-1">
            <Button asChild size="sm" className="h-10 flex-1">
              <Link to="/projects/$slug" params={{ slug: project.slug }}>
                <Eye className="h-4 w-4" />
                View Project
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 flex-1"
              onClick={() => openEnquiry({ project: title })}
            >
              <Download className="h-4 w-4" />
              Brochure
            </Button>
            {waHref ? (
              <Button
                asChild
                size="icon"
                aria-label="Chat on WhatsApp"
                className="h-10 w-10 shrink-0 bg-[#25D366] text-white hover:bg-[#20b558]"
              >
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function FactCell({
  icon,
  label,
  value,
  accent,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--gold-2)]">
        {icon}
        {label}
      </p>
      <p
        className={
          accent
            ? "mt-1 truncate font-serif text-[18px] font-semibold text-[color:var(--navy)] md:text-[20px]"
            : "mt-1 truncate text-[14px] font-semibold text-[color:var(--navy)]"
        }
      >
        {value}
      </p>
    </div>
  );
}

function buildHighlights(p: Project): string[] {
  const out: string[] = [];
  if (p.rera && p.rera.trim().length > 4) out.push("RERA Approved");
  if (/high\s?rise|tower|floors?/i.test(p.excerpt ?? "")) out.push("High Rise");
  if (p.unit_types) out.push(`${p.unit_types} BHK`);
  if (p.sizes) out.push(`${p.sizes} sq.ft +`);
  if (/gated|community|resid/i.test(p.excerpt ?? "")) out.push("Gated Community");
  if (out.length < 3) out.push("Premium Community");
  return Array.from(new Set(out)).slice(0, 4);
}

/**
 * ProjectCard — reusable grid card. Compact: image, tight pricing row,
 * up-to-4 chips, single-row CTA (View / Brochure / WhatsApp icon).
 */
export function ProjectCard({
  project,
  whatsapp,
}: {
  project: Project;
  whatsapp?: string;
}) {
  const { open: openEnquiry } = useEnquiry();
  const status = statusTone(project.status);
  const waHref = waLink(project, whatsapp);
  const locTitle = locationTitle(project);
  const title = projectTitle(project);
  const highlights = buildHighlights(project).slice(0, 4);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_1px_2px_rgba(10,31,68,.04),0_16px_40px_-28px_rgba(10,31,68,.2)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(10,31,68,.04),0_28px_60px_-28px_rgba(10,31,68,.32)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--mist)]/40">
        <img
          src={projectImage(project)}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--navy)]/60 via-transparent to-transparent" />

        <div className="pointer-events-none absolute inset-x-4 top-4 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--navy)]/85 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)] backdrop-blur-sm">
            <Crown className="h-2.5 w-2.5" />
            Luxury
          </span>
          {status ? (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm ${status.className}`}
            >
              {status.label}
            </span>
          ) : null}
        </div>

        {locTitle ? (
          <div className="pointer-events-none absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--navy)]">
            <MapPin className="h-3 w-3 text-[color:var(--gold-2)]" />
            {locTitle}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-x-4 bottom-4 text-white">
          {project.builder ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
              {project.builder}
            </p>
          ) : null}
          <h3 className="mt-1 font-serif text-[20px] font-semibold leading-tight drop-shadow line-clamp-1">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        {project.excerpt ? (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {decodeEntities(project.excerpt)}
          </p>
        ) : null}

        {/* Compact pricing row: Starting / Config / Possession */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-[color:var(--gold)]/15 bg-[color:var(--ivory)]/60 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--gold-2)]">
              Starting
            </p>
            <p className="mt-0.5 truncate font-serif text-[15px] font-semibold text-[color:var(--navy)]">
              {priceLabel(project)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--gold-2)]">
              <Ruler className="h-2.5 w-2.5" />
              Config
            </p>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-[color:var(--navy)]">
              {project.unit_types || "—"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--gold-2)]">
              <Calendar className="h-2.5 w-2.5" />
              Possession
            </p>
            <p className="mt-0.5 truncate text-[12px] font-semibold text-[color:var(--navy)]">
              {project.possession || "On Request"}
            </p>
          </div>
        </div>

        {highlights.length ? (
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--gold)]/25 bg-white px-2 py-0.5 text-[10px] font-medium text-[color:var(--navy)]"
              >
                <CheckCircle2 className="h-2.5 w-2.5 text-[color:var(--gold-2)]" />
                {h}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button asChild size="sm" className="h-9 flex-1">
            <Link to="/projects/$slug" params={{ slug: project.slug }}>
              View Project
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1"
            onClick={() => openEnquiry({ project: title })}
          >
            <Download className="h-4 w-4" />
            Brochure
          </Button>
          {waHref ? (
            <Button
              asChild
              size="icon"
              aria-label="Chat on WhatsApp"
              className="h-9 w-9 shrink-0 bg-[#25D366] text-white hover:bg-[#20b558]"
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
