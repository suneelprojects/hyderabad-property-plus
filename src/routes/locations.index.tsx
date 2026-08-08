import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Search as SearchIcon } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { useLocations } from "@/hooks/queries";
import { locationsQueryOptions } from "@/hooks/queries";
import type { Location } from "@/types/hrc";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

export const Route = createFileRoute("/locations/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(locationsQueryOptions()),
  head: () => ({
    meta: [
      { title: "Locations — Hyderabad Realty Choices" },
      {
        name: "description",
        content:
          "Explore every premium micro-market in Hyderabad — from the Financial District to Kokapet, Gachibowli, Kondapur, Nallagandla and Tellapur.",
      },
      { property: "og:title", content: "Locations — Hyderabad Realty Choices" },
      {
        property: "og:description",
        content:
          "Every micro-market that makes Hyderabad the country's hottest real estate story.",
      },
    ],
  }),
  component: LocationsIndexPage,
});

function locationImage(l: Location): string {
  if (typeof l.card_image === "string" && l.card_image) return l.card_image;
  if (typeof l.featured_image === "string" && l.featured_image)
    return l.featured_image;
  if (typeof l.banner_image === "string" && l.banner_image)
    return l.banner_image;
  return FALLBACK_IMG;
}

function projectsCount(l: Location): number {
  return l.projects_count ?? l.project_count ?? 0;
}

function LocationsIndexPage() {
  const { data: locations, isLoading, isError, refetch } = useLocations();

  return (
    <PageShell
      eyebrow="Explore Hyderabad"
      title="All Locations"
      subtitle="Every micro-market that makes Hyderabad the country's hottest real estate story."
    >
      {isError ? (
        <ErrorState
          action={
            <Button onClick={() => refetch()} variant="outline">
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[420px] animate-pulse rounded-[var(--radius)] bg-white"
            />
          ))}
        </div>
      ) : !locations?.length ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No locations available yet"
          description="Please check back soon — we're adding new micro-markets."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((l) => (
            <LocationCard key={l.id} location={l} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function LocationCard({ location }: { location: Location }) {
  const count = projectsCount(location);
  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius)] bg-white shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
      <Link
        to="/locations/$slug"
        params={{ slug: location.slug }}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <img
          src={locationImage(location)}
          alt={location.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-serif text-2xl font-semibold text-[color:var(--navy)]">
          {location.title}
        </h3>

        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold-2)]">
          {count} {count === 1 ? "Project" : "Projects"}
        </p>

        {location.excerpt ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {location.excerpt}
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <Link
            to="/locations/$slug"
            params={{ slug: location.slug }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--navy)] transition-colors hover:text-[color:var(--gold-2)]"
          >
            <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
            View Projects
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
