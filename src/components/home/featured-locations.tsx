import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLocations } from "@/hooks/queries";
import type { Location } from "@/types/hrc";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

function locationImage(l: Location): string {
  if (typeof l.featured_image === "string" && l.featured_image) {
    return l.featured_image;
  }
  return FALLBACK_IMG;
}

/**
 * FeaturedLocations — grid of 6 location cards. Each shows a hero image,
 * name, project count and a "View Projects" link. Wired to /locations.
 */
export function FeaturedLocations() {
  const { data, isLoading } = useLocations();
  const items = (data ?? []).slice(0, 6);

  return (
    <Section id="locations">
      <SectionHeading
        eyebrow="Featured Locations"
        title={<>Where Hyderabad&rsquo;s finest choose to live</>}
        subtitle="Discover the neighborhoods redefining premium living in the city."
      />

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && !items.length
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[380px] animate-pulse rounded-[var(--radius)] bg-[color:var(--mist)]"
              />
            ))
          : items.map((loc) => {
              const count =
                (loc as unknown as { projects_count?: number }).projects_count ??
                loc.project_count ??
                0;
              return (
                <Link
                  key={loc.id}
                  to="/location/$slug"
                  params={{ slug: loc.slug }}
                  className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[color:var(--border)] bg-white shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={locationImage(loc)}
                      alt={loc.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h3 className="font-serif text-2xl font-semibold text-[color:var(--navy)]">
                      {loc.title}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--gold-2)]">
                      {count} {count === 1 ? "Project" : "Projects"}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-[color:var(--navy)] transition-colors group-hover:text-[color:var(--gold-2)]">
                      View Projects
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>
    </Section>
  );
}
