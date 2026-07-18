import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProjectRow, WhatsAppIcon } from "@/components/projects/project-cards";
import {
  locationProjectsQueryOptions,
  locationQueryOptions,
  useLocation,
  useLocationProjects,
  useMeta,
} from "@/hooks/queries";
import type { Location } from "@/types/hrc";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80";

export const Route = createFileRoute("/locations/$slug")({
  loader: async ({ context, params }) => {
    const location = await context.queryClient
      .ensureQueryData(locationQueryOptions(params.slug))
      .catch(() => null);
    if (!location) throw notFound();
    context.queryClient.prefetchQuery(
      locationProjectsQueryOptions(params.slug),
    );
    return { title: location.title, description: location.excerpt };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.title}, Hyderabad — Projects & Overview`
          : "Location — Hyderabad Realty Choices",
      },
      {
        name: "description",
        content:
          loaderData?.description ||
          "Explore premium residential projects in this Hyderabad micro-market.",
      },
      {
        property: "og:title",
        content: loaderData
          ? `${loaderData.title}, Hyderabad`
          : "Location — Hyderabad Realty Choices",
      },
      {
        property: "og:description",
        content:
          loaderData?.description ||
          "Explore premium residential projects in this Hyderabad micro-market.",
      },
    ],
  }),
  notFoundComponent: () => (
    <Container className="py-24 text-center">
      <h1 className="font-serif text-3xl text-[color:var(--navy)]">
        Location not found
      </h1>
      <p className="mt-3 text-muted-foreground">
        The area you're looking for isn't in our catalogue yet.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link to="/locations">Browse all locations</Link>
        </Button>
      </div>
    </Container>
  ),
  errorComponent: ({ error, reset }) => (
    <Container className="py-24">
      <ErrorState
        title="Couldn't load location"
        description={error.message}
        action={
          <Button onClick={reset} variant="outline">
            Retry
          </Button>
        }
      />
    </Container>
  ),
  component: LocationDetailPage,
});

function bannerImage(l?: Location): string {
  if (!l) return FALLBACK_BANNER;
  if (typeof l.banner_image === "string" && l.banner_image) return l.banner_image;
  if (typeof l.featured_image === "string" && l.featured_image)
    return l.featured_image;
  if (typeof l.card_image === "string" && l.card_image) return l.card_image;
  return FALLBACK_BANNER;
}

function LocationDetailPage() {
  const { slug } = Route.useParams();
  const { data: location } = useLocation(slug);
  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch,
  } = useLocationProjects(slug);
  const { data: meta } = useMeta();

  const projectsCount =
    projects?.length ??
    location?.projects_count ??
    location?.project_count ??
    0;

  const waNumber = (meta?.whatsapp || meta?.phone || "").replace(/\D/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Hi, I am interested in ${location?.title ?? "this location"}`,
      )}`
    : undefined;
  const telHref = meta?.phone
    ? `tel:${meta.phone.replace(/\s+/g, "")}`
    : undefined;

  return (
    <>
      {/* Hero banner */}
      <section
        className="relative isolate flex min-h-[560px] items-end overflow-hidden pt-[120px]"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10,31,68,.55) 0%, rgba(10,31,68,.78) 60%, rgba(10,31,68,.92) 100%), url(${bannerImage(location)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Container className="pb-14">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Locations", href: "/locations" },
              { label: location?.title ?? slug },
            ]}
            className="mb-6 text-white/80"
          />

          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
            Location
          </span>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">
            {location?.title ?? "Loading…"}
            {location ? ", Hyderabad" : ""}
          </h1>
          {location?.excerpt ? (
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/85">
              {location.excerpt}
            </p>
          ) : null}

          {/* Stat strip */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-10">
            <Stat
              value={String(projectsCount)}
              label="Projects Available"
            />
            <Stat
              value={location?.price_from ? location.price_from : "On Request"}
              label="Starting Price"
            />
            <Stat
              value={location?.connectivity || "Well Connected"}
              label="Connectivity"
            />
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {telHref ? (
              <Button asChild variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20">
                <a href={telHref}>Call</a>
              </Button>
            ) : null}
            {waHref ? (
              <Button asChild className="bg-[#25D366] text-white hover:bg-[#20b558]">
                <a href={waHref} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
            <Button asChild>
              <Link
                to="/projects"
                search={{
                  location: slug,
                  q: "",
                  type: "",
                  bhk: "",
                  status: "",
                  view: "list",
                  page: 1,
                }}
              >
                Book Site Visit
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Overview */}
      {location?.content_html ? (
        <section className="bg-white py-14">
          <Container>
            <div
              className="prose prose-neutral mx-auto max-w-3xl text-center text-[16px] leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: location.content_html }}
            />
          </Container>
        </section>
      ) : null}

      {/* Projects in this location */}
      <section className="bg-[color:var(--mist)]/40 py-16 md:py-20">
        <Container>
          <SectionHeading
            eyebrow="Handpicked Developments"
            title={
              location
                ? `Projects in ${location.title}`
                : "Projects"
            }
            subtitle="Every project below is RERA-verified and priced direct-from-builder."
            align="left"
            className="mb-10 border-b border-[color:var(--gold)]/30 pb-6"
          />

          {projectsError ? (
            <ErrorState
              action={
                <Button onClick={() => refetch()} variant="outline">
                  Try again
                </Button>
              }
            />
          ) : projectsLoading ? (
            <div className="flex flex-col gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[320px] animate-pulse rounded-[var(--radius)] bg-white"
                />
              ))}
            </div>
          ) : !projects?.length ? (
            <EmptyState
              icon={<SearchIcon className="h-8 w-8" />}
              title="No projects live in this location yet"
              description="We're curating new developments here — check back soon or explore other neighborhoods."
              action={
                <Button asChild variant="outline">
                  <Link to="/locations">All Locations</Link>
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              {projects.map((p) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  whatsapp={meta?.whatsapp || meta?.phone}
                />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-3xl font-semibold text-[color:var(--gold)] md:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
        {label}
      </p>
    </div>
  );
}
