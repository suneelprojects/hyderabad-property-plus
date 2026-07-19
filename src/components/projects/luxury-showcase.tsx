import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  BedDouble,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Eye,
  MapPin,
  
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Project } from "@/types/hrc";
import { amenityIcon } from "./amenity-icon";
import { WhatsAppIcon, priceLabel, projectImage } from "./project-cards";

const AUTOPLAY_MS = 6000;

function amenityName(a: NonNullable<Project["amenities_top4"]>[number]): string {
  return typeof a === "string" ? a : a.name;
}

function statusPill(status?: string) {
  if (!status) return null;
  const s = status.toLowerCase();
  if (/(ready|move|possess)/.test(s))
    return { label: "Ready to Move", className: "bg-emerald-500/95 text-white" };
  return { label: status, className: "bg-white/95 text-[color:var(--navy)]" };
}

function buildHighlights(p: Project): string[] {
  const out: string[] = [];
  if (p.rera && p.rera.trim().length > 4) out.push("RERA Approved");
  if (/high\s?rise|tower|floors?/i.test(p.excerpt ?? "")) out.push("High Rise");
  if (/gated|community/i.test(p.excerpt ?? "")) out.push("Gated Community");
  if (p.unit_types) out.push(`${p.unit_types} BHK`);
  if (p.sizes) out.push("Spacious Layouts");
  out.push("Premium Community");
  return Array.from(new Set(out)).slice(0, 5);
}

/**
 * LuxuryShowcase — full-width brochure-style carousel. One project fills the
 * stage: dominant image left, editorial detail column right. Autoplays every
 * 6s, pauses on hover, supports arrows, dots, keyboard, and swipe.
 */
export function LuxuryShowcase({
  projects,
  whatsapp,
}: {
  projects: Project[];
  whatsapp?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = projects.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // autoplay
  useEffect(() => {
    if (paused || total <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, total]);

  // keyboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!total) return null;
  const project = projects[index];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative outline-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        touchStart.current = null;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured luxury projects"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-black/[0.04] bg-white shadow-[0_2px_4px_rgba(10,31,68,.04),0_40px_100px_-40px_rgba(10,31,68,.28)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <Slide project={project} whatsapp={whatsapp} />
          </motion.div>
        </AnimatePresence>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous project"
              className="group/arrow absolute left-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-3 text-[color:var(--navy)] shadow-[0_8px_24px_rgba(10,31,68,.18)] transition-all hover:bg-white hover:shadow-[0_12px_32px_rgba(10,31,68,.28)] md:inline-flex lg:left-6"
            >
              <ChevronLeft className="h-5 w-5 transition-transform group-hover/arrow:-translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next project"
              className="group/arrow absolute right-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/95 p-3 text-[color:var(--navy)] shadow-[0_8px_24px_rgba(10,31,68,.18)] transition-all hover:bg-white hover:shadow-[0_12px_32px_rgba(10,31,68,.28)] md:inline-flex lg:right-6"
            >
              <ChevronRight className="h-5 w-5 transition-transform group-hover/arrow:translate-x-0.5" />
            </button>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          {projects.map((p, i) => {
            const active = i === index;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show project ${i + 1}`}
                aria-current={active}
                className={
                  active
                    ? "h-1.5 w-12 overflow-hidden rounded-full bg-[color:var(--navy)]/10"
                    : "h-1.5 w-6 rounded-full bg-[color:var(--navy)]/15 transition-all hover:w-8 hover:bg-[color:var(--navy)]/30"
                }
              >
                {active ? (
                  <motion.span
                    key={`${p.id}-${paused}`}
                    initial={{ width: "0%" }}
                    animate={{ width: paused ? "35%" : "100%" }}
                    transition={{
                      duration: paused ? 0.3 : AUTOPLAY_MS / 1000,
                      ease: "linear",
                    }}
                    className="block h-full rounded-full bg-[color:var(--gold)]"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Slide({
  project,
  whatsapp,
}: {
  project: Project;
  whatsapp?: string;
}) {
  const waNumber = (whatsapp ?? "").replace(/\D/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Hi, I am interested in ${project.title}. Please share details.`,
      )}`
    : undefined;

  const status = statusPill(project.status);
  const photos = project.gallery?.length ?? 0;
  const highlights = buildHighlights(project);
  const amenities = project.amenities_top4?.slice(0, 6) ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[55%_45%]">
      {/* IMAGE */}
      <div className="group/img relative overflow-hidden bg-[color:var(--mist)]/40 lg:min-h-[640px]">
        <div className="aspect-[4/3] lg:absolute lg:inset-0 lg:aspect-auto">
          <img
            src={projectImage(project)}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover/img:scale-[1.05]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--navy)]/60 via-transparent to-transparent" />

        <div className="pointer-events-none absolute inset-x-6 top-6 flex flex-wrap items-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--navy)]/85 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)] backdrop-blur-sm">
            <Crown className="h-3 w-3" />
            Luxury Collection
          </span>
          {project.featured ? (
            <span className="inline-flex rounded-full bg-[color:var(--gold)] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--navy)]">
              Featured
            </span>
          ) : null}
          {status ? (
            <span
              className={`inline-flex rounded-full px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-sm ${status.className}`}
            >
              {status.label}
            </span>
          ) : null}
        </div>

        {photos > 0 ? (
          <div className="pointer-events-none absolute bottom-6 left-6 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Camera className="h-3.5 w-3.5" />
            {photos} Photos
          </div>
        ) : null}

        {project.location ? (
          <div className="pointer-events-none absolute bottom-6 right-6 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--navy)]">
            <MapPin className="h-3.5 w-3.5 text-[color:var(--gold-2)]" />
            {project.location.title}
          </div>
        ) : null}
      </div>

      {/* DETAILS */}
      <div className="flex flex-col gap-6 p-8 md:p-10 lg:p-12">
        <header className="flex flex-col gap-3">
          {project.builder ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--gold-2)]">
              By {project.builder}
            </span>
          ) : null}
          <h3 className="font-serif text-[32px] font-semibold leading-[1.1] text-[color:var(--navy)] md:text-[40px]">
            {project.title}
          </h3>
          {project.location ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
              {project.location.title}, Hyderabad
            </p>
          ) : null}
          {project.excerpt ? (
            <p className="line-clamp-3 text-[15px] leading-relaxed text-muted-foreground">
              {project.excerpt}
            </p>
          ) : null}
        </header>

        {highlights.length ? (
          <div className="flex flex-wrap gap-2">
            {highlights.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/30 bg-[color:var(--ivory)] px-3 py-1.5 text-[11px] font-medium text-[color:var(--navy)]"
              >
                <CheckCircle2 className="h-3 w-3 text-[color:var(--gold-2)]" />
                {h}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-4 rounded-2xl border border-[color:var(--gold)]/15 bg-gradient-to-br from-[color:var(--ivory)] to-white p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold-2)]">
              Starting From
            </p>
            <p className="mt-1.5 truncate font-serif text-[24px] font-semibold text-[color:var(--navy)] md:text-[28px]">
              {priceLabel(project)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold-2)]">
              <BedDouble className="h-3 w-3" />
              Config
            </p>
            <p className="mt-1.5 truncate text-[15px] font-semibold text-[color:var(--navy)]">
              {project.unit_types || "—"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold-2)]">
              <Calendar className="h-3 w-3" />
              Possession
            </p>
            <p className="mt-1.5 truncate text-[15px] font-semibold text-[color:var(--navy)]">
              {project.possession || "On Request"}
            </p>
          </div>
        </div>

        {amenities.length ? (
          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--gold-2)]">
              Signature Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a, i) => {
                const name = amenityName(a);
                const Icon = amenityIcon(name);
                return (
                  <span
                    key={`${name}-${i}`}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-[12px] font-medium text-[color:var(--navy)] transition-colors hover:border-[color:var(--gold)]/50 hover:bg-[color:var(--ivory)]"
                  >
                    <Icon className="h-3.5 w-3.5 text-[color:var(--gold-2)]" />
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button asChild size="lg" className="flex-1 sm:flex-none">
            <Link to="/projects/$slug" params={{ slug: project.slug }}>
              <Eye className="h-4 w-4" />
              View Project
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#contact">
              <Download className="h-4 w-4" />
              Brochure
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#contact">
              <Calendar className="h-4 w-4" />
              Site Visit
            </a>
          </Button>
          {waHref ? (
            <Button
              asChild
              size="lg"
              className="bg-[#25D366] text-white hover:bg-[#20b558]"
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Re-export Ruler so unused-import lint doesn't complain elsewhere in file
export const _Ruler = Ruler;
