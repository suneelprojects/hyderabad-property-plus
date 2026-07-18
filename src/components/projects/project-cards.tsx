import { Link } from "@tanstack/react-router";
import { Crown, Eye, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/hrc";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

export function projectImage(p: Project): string {
  if (typeof p.featured_image === "string" && p.featured_image)
    return p.featured_image;
  if (p.gallery?.length) return p.gallery[0];
  return FALLBACK_IMG;
}

export function priceLabel(p: Project): string {
  if (!p.price_from) return "On Request";
  if (typeof p.price_from === "number") return `₹ ${p.price_from}`;
  return String(p.price_from);
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.52 3.48A11.79 11.79 0 0 0 12.06 0C5.5 0 .17 5.33.17 11.89c0 2.09.55 4.14 1.6 5.94L0 24l6.34-1.66a11.86 11.86 0 0 0 5.7 1.45h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.17-1.24-6.16-3.42-8.42Zm-8.46 18.3h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.76.99 1-3.67-.23-.38a9.86 9.86 0 0 1-1.51-5.24c0-5.46 4.45-9.91 9.9-9.91 2.64 0 5.13 1.03 7 2.9a9.85 9.85 0 0 1 2.91 7c0 5.46-4.45 9.9-9.9 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.08 3.17 5.03 4.44.7.3 1.25.48 1.68.62.71.23 1.35.2 1.86.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function ProjectRow({
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

  return (
    <article className="overflow-hidden rounded-[var(--radius)] bg-white shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr_0.85fr]">
        <div className="relative aspect-[4/3] md:aspect-auto">
          <img
            src={projectImage(project)}
            alt={project.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-8">
          {project.builder ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--gold-2)]">
              <Crown className="h-3.5 w-3.5" />
              By {project.builder}
            </span>
          ) : null}

          <h3 className="font-serif text-3xl font-semibold text-[color:var(--navy)]">
            {project.title}
          </h3>

          {project.location ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
              {project.location.title}, Hyderabad
            </p>
          ) : null}

          {project.excerpt ? (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {project.excerpt}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-6 border-t border-[color:var(--border)] p-6 md:border-l md:border-t-0 md:p-8">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold-2)]">
              Starting From
            </p>
            <p className="mt-2 font-serif text-3xl font-semibold text-[color:var(--navy)]">
              {priceLabel(project)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Onwards · All-Inclusive
            </p>
          </div>

          {project.amenities_top4?.length ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold-2)]">
                Top Amenities
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {project.amenities_top4.slice(0, 4).map((a) => {
                  const name = typeof a === "string" ? a : a.name;
                  return (
                    <span
                      key={typeof a === "string" ? a : a.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 text-[color:var(--gold-2)]"
                      title={name}
                      aria-label={name}
                    >
                      <span className="text-xs">
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-[color:var(--border)] bg-[color:var(--mist)]/40 p-4 md:grid-cols-3">
        <Button variant="default" asChild>
          <Link to="/projects/$slug" params={{ slug: project.slug }}>
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <a href="#contact">
            <Mail className="h-4 w-4" />
            Enquire Now
          </a>
        </Button>
        {waHref ? (
          <Button asChild className="bg-[#25D366] text-white hover:bg-[#20b558]">
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius)] bg-white shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={projectImage(project)}
          alt={project.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {project.builder ? (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--gold-2)] shadow-sm">
            <Crown className="h-3 w-3" />
            {project.builder}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-serif text-2xl font-semibold leading-tight text-[color:var(--navy)]">
          {project.title}
        </h3>

        {project.location ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
            {project.location.title}, Hyderabad
          </p>
        ) : null}

        {project.excerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {project.excerpt}
          </p>
        ) : null}

        <div className="mt-auto pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--gold-2)]">
            Starting From
          </p>
          <p className="font-serif text-xl font-semibold text-[color:var(--navy)]">
            {priceLabel(project)}
          </p>
        </div>
      </div>

      <div className="border-t border-[color:var(--border)] bg-[color:var(--mist)]/40 p-4">
        <Button variant="default" asChild className="w-full">
          <Link to="/projects/$slug" params={{ slug: project.slug }}>
            <Eye className="h-4 w-4" />
            View Details
          </Link>
        </Button>
      </div>
    </article>
  );
}
