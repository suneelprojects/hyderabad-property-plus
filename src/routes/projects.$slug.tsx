import { useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
} from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Building2,
  CalendarCheck,
  ChevronDown,
  Download,
  Headphones,
  Home as HomeIcon,
  Landmark,
  Layers,
  MapPin,
  Phone,
  Ruler,
  Send,
  Sparkles,
  Tag as TagIcon,
  Wallet,
  RotateCcw,
  MessageCircle,
  Mail,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useEnquiry } from "@/components/enquiry-modal";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import {
  amenitiesQueryOptions,
  flatsQueryOptions,
  imagesQueryOptions,
  metaQueryOptions,
  projectQueryOptions,
} from "@/hooks/queries";
import { HrcApiError } from "@/services/api";
import { formatArea, formatPriceInr } from "@/lib/format";
import { imageSrc } from "@/lib/image";
import {
  resolveFlatImagesForList,
  FLAT_FALLBACK_IMAGE,
  type ResolvedFlatImage,
} from "@/lib/flat-imagery";
import { decodeEntities } from "@/lib/html";
import { cn } from "@/lib/utils";
import type { Flat, Project } from "@/types/hrc";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params, context }) => {
    try {
      const project = await context.queryClient.ensureQueryData(
        projectQueryOptions(params.slug),
      );
      // Prime side-panel data in the background.
      void context.queryClient.prefetchQuery(amenitiesQueryOptions(project.id));
      void context.queryClient.prefetchQuery(imagesQueryOptions(project.id));
      void context.queryClient.prefetchQuery(
        flatsQueryOptions({ project: project.id, per_page: 48 }),
      );
      void context.queryClient.prefetchQuery(metaQueryOptions());
      return { slug: params.slug };
    } catch (err) {
      if (err instanceof HrcApiError && err.status === 404) throw notFound();
      throw err;
    }
  },
  head: ({ loaderData }) => {
    const slug = loaderData?.slug;
    const title = slug
      ? `${toTitle(slug)} — Hyderabad Realty Choices`
      : "Project — Hyderabad Realty Choices";
    return {
      meta: [
        { title },
        {
          name: "description",
          content:
            "Explore project details, floor plans, live inventory, amenities and pricing.",
        },
        { property: "og:title", content: title },
      ],
    };
  },
  component: ProjectDetail,
  errorComponent: ({ error }) => (
    <div className="pt-[88px]">
      <Container className="py-16">
        <ErrorState
          title="Could not load project"
          description={error.message}
        />
      </Container>
    </div>
  ),
  notFoundComponent: () => (
    <div className="pt-[88px]">
      <Container className="py-16">
        <EmptyState
          title="Project not found"
          description="The project you are looking for does not exist or has been removed."
          action={
            <Link to="/projects" className="text-[color:var(--gold)] underline">
              Back to projects
            </Link>
          }
        />
      </Container>
    </div>
  ),
});

function toTitle(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------- helpers

interface FaqLike {
  question?: string;
  q?: string;
  answer?: string;
  a?: string;
}
interface NearbyLike {
  name?: string;
  place?: string;
  category?: string;
  type?: string;
  distance?: string;
}
interface SpecEntry {
  label: string;
  value: string;
}
interface QuickFactLike {
  label?: string;
  key?: string;
  value?: string;
  icon?: string;
}

function toEntries(v: unknown): SpecEntry[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v
      .map((row): SpecEntry | null => {
        if (!row) return null;
        if (typeof row === "string") return { label: row, value: "" };
        if (typeof row === "object") {
          const r = row as Record<string, unknown>;
          const label = String(r.label ?? r.key ?? r.name ?? "");
          const value = String(r.value ?? r.val ?? "");
          if (!label && !value) return null;
          return { label, value };
        }
        return null;
      })
      .filter((x): x is SpecEntry => x !== null);
  }
  if (typeof v === "object") {
    return Object.entries(v as Record<string, unknown>).map(([k, val]) => ({
      label: k,
      value: String(val ?? ""),
    }));
  }
  return [];
}

// ---------------------------------------------------------------- lead gate

/**
 * All high-intent CTAs on the Project Details page must capture a lead
 * before performing their action. Opens the shared enquiry modal and only
 * runs the action after a successful submission.
 */
function useLeadGate() {
  const { open } = useEnquiry();

  const bookVisit = (project: Project) =>
    open({
      project: project.title,
      projectId: project.id,
      title: "Book a Free Site Visit",
      subtitle:
        "Share a few details and our senior advisor will confirm your site visit within one business hour.",
    });

  const downloadBrochure = (project: Project) => {
    const url = (project as unknown as { brochure_url?: string }).brochure_url;
    open({
      project: project.title,
      projectId: project.id,
      title: "Download Brochure",
      subtitle:
        "Share your contact details — we'll open the brochure and email you a copy.",
      onSuccess: () => {
        if (!url) {
          toast.error(
            "Brochure isn't uploaded yet. Our advisor will email it to you shortly.",
          );
          return;
        }
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      },
    });
  };

  const callAdvisor = (project: Project, phone: string) =>
    open({
      project: project.title,
      projectId: project.id,
      title: "Talk to a Senior Advisor",
      subtitle:
        "Share your details and we'll connect you with an advisor right away.",
      onSuccess: () => {
        const tel = `tel:${(phone || "").replace(/\s/g, "")}`;
        if (tel !== "tel:") window.location.href = tel;
      },
    });

  return { bookVisit, downloadBrochure, callAdvisor };
}


// ---------------------------------------------------------------- page

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { data: project } = useSuspenseQuery(projectQueryOptions(slug));
  const { data: meta } = useSuspenseQuery(metaQueryOptions());

  const phone = meta?.phone || "+919000000000";
  const whatsapp = meta?.whatsapp || phone;
  const whatsappMsg = encodeURIComponent(
    `Hi, I am interested in ${project.title}`,
  );
  const whatsappUrl = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${whatsappMsg}`;
  const telUrl = `tel:${phone.replace(/\s/g, "")}`;

  const heroImage =
    imageSrc(project.featured_image, null) ||
    (Array.isArray(project.gallery) && project.gallery[0]) ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80";

  const crumbs: Crumb[] = [
    { label: "Projects", href: "/projects" },
    ...(project.location
      ? [{ label: project.location.title }]
      : []),
    { label: project.title },
  ];

  return (
    <>
      <ProjectHero
        project={project}
        heroImage={heroImage}
        crumbs={crumbs}
        telUrl={telUrl}
        phone={phone}
      />
      <QuickFacts project={project} />
      <ProjectOverview project={project} phone={phone} />
      <AvailableFlats project={project} />
      <AmenitiesSection project={project} />
      <SpecificationsSection project={project} />
      <NearbySection project={project} />
      <FaqSection project={project} />
      <EnquireCta project={project} phone={phone} />
      <PriceInformation project={project} phone={phone} />
      <MobileStickyBar
        telUrl={telUrl}
        whatsappUrl={whatsappUrl}
        phone={phone}
      />
    </>
  );
}

// ---------------------------------------------------------------- hero

function ProjectHero({
  project,
  heroImage,
  crumbs,
  telUrl: _telUrl,
  phone,
}: {
  project: Project;
  heroImage: string;
  crumbs: Crumb[];
  telUrl: string;
  phone: string;
}) {
  const { bookVisit, downloadBrochure, callAdvisor } = useLeadGate();
  return (
    <header className="relative isolate flex min-h-[560px] items-end overflow-hidden pt-[120px] text-white md:min-h-[640px]">
      <img
        src={heroImage}
        alt={project.title}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        loading="eager"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,31,68,.55) 0%, rgba(10,31,68,.78) 60%, rgba(10,31,68,.92) 100%)",
        }}
      />
      <Container className="relative w-full pb-14">
        <Breadcrumbs
          items={crumbs}
          className="mb-6 !text-white/80 [&_a]:!text-white/80 [&_a:hover]:!text-[color:var(--gold)]"
        />
        {project.builder ? (
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
            {project.builder}
          </div>
        ) : null}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-serif text-4xl font-semibold leading-tight md:text-6xl"
        >
          {project.title}
        </motion.h1>
        {project.location ? (
          <div className="mt-4 flex items-center gap-2 text-white/85">
            <MapPin className="h-4 w-4 text-[color:var(--gold)]" />
            <span className="text-[15px]">
              {project.location.title}, Hyderabad
            </span>
          </div>
        ) : null}
        {project.status ? (
          <div className="mt-6">
            <div className="font-serif text-2xl font-semibold text-[color:var(--gold)]">
              {project.status}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              Status
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="gold" size="lg" onClick={() => bookVisit(project)}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            Book Site Visit
          </Button>
          <Button
            variant="hero-outline"
            size="lg"
            onClick={() => downloadBrochure(project)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Brochure
          </Button>
          <Button
            variant="hero-outline"
            size="lg"
            onClick={() => callAdvisor(project, phone)}
          >
            <Headphones className="mr-2 h-4 w-4" />
            Call Advisor
          </Button>
        </div>
      </Container>
    </header>
  );
}

// ---------------------------------------------------------------- quick facts

function QuickFacts({ project }: { project: Project }) {
  const raw = (project as unknown as { quick_facts?: unknown }).quick_facts;
  const arr = Array.isArray(raw) ? (raw as QuickFactLike[]) : [];

  const items: { label: string; value: string; icon: React.ReactNode }[] = [];
  if (project.builder)
    items.push({
      label: "Builder",
      value: project.builder,
      icon: <Building2 className="h-5 w-5" />,
    });
  if (project.property_type)
    items.push({
      label: "Property Type",
      value: project.property_type,
      icon: <HomeIcon className="h-5 w-5" />,
    });
  if (project.unit_types)
    items.push({
      label: "Configuration",
      value: project.unit_types,
      icon: <Layers className="h-5 w-5" />,
    });
  if (project.sizes)
    items.push({
      label: "Size Range",
      value: formatArea(project.sizes),
      icon: <Ruler className="h-5 w-5" />,
    });
  if (project.possession)
    items.push({
      label: "Possession",
      value: project.possession,
      icon: <CalendarCheck className="h-5 w-5" />,
    });
  if (project.rera)
    items.push({
      label: "RERA",
      value: project.rera,
      icon: <TagIcon className="h-5 w-5" />,
    });
  arr.forEach((r) => {
    const label = String(r.label ?? r.key ?? "");
    const value = String(r.value ?? "");
    if (label && value) items.push({
      label,
      value,
      icon: <Sparkles className="h-5 w-5" />,
    });
  });

  return (
    <Section className="hrc-section">
      <SectionHeading eyebrow="At a glance" title="Quick Facts" />
      <UnderlineRule />
      <div className="mt-10 rounded-2xl border border-[color:var(--mist)] bg-white p-6 shadow-[0_10px_40px_-24px_rgba(10,31,68,.25)] md:p-10">
        <div
          className={cn(
            "grid gap-x-8 gap-y-8",
            items.length <= 2
              ? "sm:grid-cols-2"
              : items.length === 3
                ? "sm:grid-cols-3"
                : "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {items.map((it) => (
            <div
              key={it.label + it.value}
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--ivory)] text-[color:var(--gold)]">
                {it.icon}
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {it.label}
              </div>
              <div className="mt-1 font-serif text-lg font-semibold text-[color:var(--navy)]">
                {it.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function UnderlineRule() {
  return (
    <div className="mx-auto mt-3 h-[3px] w-16 rounded-full bg-[color:var(--gold)]" />
  );
}

// ---------------------------------------------------------------- overview

function ProjectOverview({
  project,
  phone,
}: {
  project: Project;
  phone: string;
}) {
  const { callAdvisor } = useLeadGate();
  const html = project.content_html || `<p>${project.excerpt || ""}</p>`;
  return (
    <Section alt className="hrc-section">
      <SectionHeading eyebrow="About the project" title="Project Overview" />
      <UnderlineRule />
      <div
        className="prose prose-slate mx-auto mt-8 max-w-3xl text-center text-[15px] leading-relaxed text-[color:var(--navy)]/85"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="mt-8 flex justify-center">
        <Button variant="gold" size="lg" onClick={() => callAdvisor(project, phone)}>
          <Headphones className="mr-2 h-4 w-4" />
          Talk to Advisor
        </Button>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- price

function PriceInformation({
  project,
  phone,
}: {
  project: Project;
  phone: string;
}) {
  const { bookVisit, downloadBrochure, callAdvisor } = useLeadGate();
  const priceLabel = project.price_from
    ? formatPriceInr(project.price_from)
    : "On Request";

  const rows: { label: string; value: string; icon: React.ReactNode }[] = [
    {
      label: "Configuration",
      value: project.unit_types || "—",
      icon: <HomeIcon className="h-5 w-5" />,
    },
    {
      label: "Size Range",
      value: project.sizes ? formatArea(project.sizes) : "— sqft",
      icon: <Ruler className="h-5 w-5" />,
    },
    {
      label: "Possession",
      value: project.possession || "TBA",
      icon: <TagIcon className="h-5 w-5" />,
    },
    {
      label: "Status",
      value: project.status || "—",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      label: "Loan Assistance",
      value: "12+ Banks",
      icon: <Landmark className="h-5 w-5" />,
    },
  ];

  return (
    <Section className="hrc-section">
      <SectionHeading eyebrow="Investment" title="Price Information" />
      <UnderlineRule />
      <p className="mx-auto mt-4 max-w-2xl text-center text-[15px] text-muted-foreground">
        Transparent, direct-from-builder pricing with zero brokerage.
      </p>

      <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-[color:var(--mist)] bg-white shadow-[0_20px_60px_-30px_rgba(10,31,68,.35)]">
        <div
          className="px-8 py-10 text-center"
          style={{
            background:
              "linear-gradient(135deg,#0a1f44 0%,#122a55 50%,#0a1f44 100%)",
          }}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Starting Price
          </div>
          <div className="mt-3 font-serif text-4xl font-semibold text-[color:var(--gold)] md:text-5xl">
            {priceLabel}
          </div>
          <div className="mt-3 text-xs italic text-white/60">
            *Prices vary by tower, floor, view and unit selection.
          </div>
        </div>
        <div className="grid gap-6 p-8 sm:grid-cols-2 md:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--ivory)] text-[color:var(--gold)]">
                {r.icon}
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {r.label}
                </div>
                <div className="mt-1 font-medium text-[color:var(--navy)]">
                  {r.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="gold" size="lg" onClick={() => bookVisit(project)}>
          <CalendarCheck className="mr-2 h-4 w-4" />
          Book Site Visit
        </Button>
        <Button variant="outline" size="lg" onClick={() => downloadBrochure(project)}>
          <Download className="mr-2 h-4 w-4" />
          Download Brochure
        </Button>
        <Button variant="ghost" size="lg" onClick={() => callAdvisor(project, phone)}>
          <Headphones className="mr-2 h-4 w-4" />
          Talk to Advisor
        </Button>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- flats

function AvailableFlats({ project }: { project: Project }) {
  const { data: flats = [] } = useSuspenseQuery(
    flatsQueryOptions({ project: project.id, per_page: 48 }),
  );

  return (
    <Section
      alt
      className="!py-10 md:!py-14"
    >
      <SectionHeading eyebrow="Live Inventory" title="Available Flats" />
      <UnderlineRule />

      <div className="mt-6">
        {flats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--mist)] bg-white/60 px-6 py-8 text-center text-sm text-muted-foreground">
            No flats added for this project yet. Check back soon.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(() => {
              const imgs = resolveFlatImagesForList(
                flats.map((f) => {
                  const r = f as unknown as { title?: string; size_sqft?: string | number };
                  const sz = r.size_sqft;
                  return {
                    id: f.id,
                    title: r.title ?? null,
                    facing: f.facing ?? null,
                    bhk: f.bhk ?? null,
                    sizeSqft:
                      sz !== undefined && sz !== null && sz !== "" ? Number(sz) : null,
                    ribbon: (f.ribbon as string | undefined) ?? null,
                    featured_image: f.featured_image,
                  };
                }),
              );
              return flats.map((f, i) => (
                <FlatCard key={f.id} flat={f} project={project} image={imgs[i]} />
              ));
            })()}
          </div>

        )}
      </div>
    </Section>
  );
}


function FilterField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
        {icon}
        {label}
      </div>
      <div className="relative">
        {children}
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--gold)]" />
      </div>
    </label>
  );
}

const RIBBON_LABELS: Record<string, string> = {
  featured: "Featured",
  premium: "Premium",
  best_value: "Best Value",
  limited_availability: "Limited Availability",
  ready_to_move: "Ready to Move",
  hot_deal: "Hot Deal",
};

function FlatCard({
  flat,
  project,
  image,
}: {
  flat: Flat;
  project: Project;
  image: ResolvedFlatImage;
}) {
  const rec = flat as unknown as {
    title?: string;
    flat_number?: string | number;
    tower?: string;
    floor?: string | number;
    size_sqft?: string | number;
    status?: string;
  };
  const { open: openEnquiry } = useEnquiry();

  const imageUrl = image.url;
  const isCurated = image.isCurated;

  const ribbonKey = (flat.ribbon || "none").toString().toLowerCase();
  const ribbonLabel = ribbonKey !== "none" ? RIBBON_LABELS[ribbonKey] ?? null : null;

  const title = rec.title ? decodeEntities(String(rec.title)) : "";

  const floorNum = Number(rec.floor);
  const hasValidFloor =
    rec.floor !== null &&
    rec.floor !== undefined &&
    rec.floor !== "" &&
    Number.isFinite(floorNum) &&
    floorNum > 0;

  const flatNumber =
    rec.flat_number !== null &&
    rec.flat_number !== undefined &&
    String(rec.flat_number).trim() !== ""
      ? String(rec.flat_number)
      : null;

  const priceNum = Number(flat.price);
  const hasPrice = Number.isFinite(priceNum) && priceNum > 0;
  const priceDisplay = hasPrice ? formatPriceInr(priceNum) : "Price on Request";

  const sizeDisplay =
    rec.size_sqft !== undefined && rec.size_sqft !== null && rec.size_sqft !== ""
      ? (() => {
          const n = Number(rec.size_sqft);
          return Number.isFinite(n)
            ? `${n.toLocaleString("en-IN")} sq.ft`
            : formatArea(String(rec.size_sqft));
        })()
      : flat.carpet_area || flat.built_up_area
        ? formatArea(flat.carpet_area || flat.built_up_area)
        : null;

  const contextBits = [
    flat.bhk,
    rec.tower ? `Tower ${rec.tower}` : null,
    hasValidFloor ? `Floor ${floorNum}` : null,
    flat.facing ? `${flat.facing} facing` : null,
    flatNumber ? `Flat ${flatNumber}` : null,
    hasPrice ? formatPriceInr(priceNum) : null,
  ].filter(Boolean) as string[];

  const handleEnquire = () => {
    openEnquiry({
      project: project.title,
      projectId: project.id,
      subtitle: `${project.title}${title ? " — " + title : ` — Flat #${flat.id}`}${contextBits.length ? " · " + contextBits.join(" · ") : ""}`,
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[color:var(--mist)] bg-white shadow-[0_10px_40px_-24px_rgba(10,31,68,.25)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-30px_rgba(10,31,68,.35)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--ivory)]">
        <img
          src={imageUrl}
          alt={title || `${flat.bhk || "Flat"} — ${project.title}`}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (el.src !== FLAT_FALLBACK_IMAGE) el.src = FLAT_FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
        />
        {/* subtle top-gradient for ribbon legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/25 to-transparent" />
        {ribbonLabel ? (
          <div className="absolute left-0 top-3 z-10">
            <div className="relative flex items-center gap-1.5 bg-[color:var(--navy)] py-1.5 pl-3 pr-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--gold)] shadow-[0_6px_20px_-8px_rgba(10,31,68,.5)]">
              <span className="h-1 w-1 rounded-full bg-[color:var(--gold)]" />
              {ribbonLabel}
              <span className="absolute -right-2 top-0 h-full w-2 [clip-path:polygon(0_0,0_100%,100%_50%)] bg-[color:var(--navy)]" />
            </div>
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <h4 className="font-serif text-base font-semibold leading-snug text-[color:var(--navy)] line-clamp-2">
          {title || flat.bhk || "Unit"}
        </h4>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {flat.bhk ? <Fact label="BHK" value={flat.bhk} /> : null}
          {sizeDisplay ? <Fact label="Size" value={sizeDisplay} /> : null}
          {rec.tower ? <Fact label="Tower" value={String(rec.tower)} /> : null}
          {hasValidFloor ? <Fact label="Floor" value={String(floorNum)} /> : null}
          {flat.facing ? <Fact label="Facing" value={flat.facing} /> : null}
          {flatNumber ? <Fact label="Flat No." value={flatNumber} /> : null}
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-[color:var(--mist)] pt-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Price
            </div>
            <div className="font-serif text-base font-semibold text-[color:var(--gold)]">
              {priceDisplay}
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnquire}
            className="inline-flex items-center gap-1 rounded-md bg-[color:var(--navy)] px-3 py-2 text-xs font-semibold text-white hover:bg-[color:var(--navy)]/90"
          >
            Enquire <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-[color:var(--navy)]">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------- amenities

function AmenitiesSection({ project }: { project: Project }) {
  const { data: amenities = [] } = useSuspenseQuery(
    amenitiesQueryOptions(project.id),
  );
  const inline = Array.isArray(project.amenities_top4) ? project.amenities_top4 : [];
  const localAmenities = Array.isArray(
    (project as unknown as { amenities?: unknown }).amenities,
  )
    ? ((project as unknown as { amenities: unknown[] }).amenities)
    : [];

  const combined = amenities.length
    ? amenities
    : localAmenities.length
      ? localAmenities.map((v, i) => ({
          id: i,
          name: typeof v === "string" ? v : String((v as { name?: string }).name || ""),
        }))
      : inline.map((v, i) => ({
          id: i,
          name: typeof v === "string" ? v : String((v as { name?: string }).name || ""),
        }));

  const items = combined
    .map((a) => ({
      id: (a as { id?: number }).id ?? Math.random(),
      name: String((a as { name?: string }).name || ""),
      icon: (a as { icon?: string }).icon,
    }))
    .filter((a) => a.name);

  if (items.length === 0) return null;

  return (
    <Section className="hrc-section">
      <SectionHeading eyebrow="Lifestyle" title="World-Class Amenities" />
      <UnderlineRule />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((a) => (
          <div
            key={String(a.id) + a.name}
            className="flex items-center gap-3 rounded-xl border border-[color:var(--mist)] bg-white px-4 py-3.5 transition hover:border-[color:var(--gold)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--ivory)] text-[color:var(--gold)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-[color:var(--navy)]">
              {a.name}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- specs

function SpecificationsSection({ project }: { project: Project }) {
  const entries = toEntries(project.specifications);
  if (!entries.length) return null;
  return (
    <Section alt className="hrc-section">
      <SectionHeading eyebrow="Build Quality" title="Specifications" />
      <UnderlineRule />
      <div className="mt-10 overflow-hidden rounded-2xl border border-[color:var(--mist)] bg-white">
        <dl className="divide-y divide-[color:var(--mist)]">
          {entries.map((e) => (
            <div
              key={e.label}
              className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-[220px_1fr] sm:items-baseline"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--gold)]">
                {e.label}
              </dt>
              <dd className="text-[15px] text-[color:var(--navy)]">
                {e.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- nearby

function NearbySection({ project }: { project: Project }) {
  const raw = (project as unknown as { nearby?: unknown }).nearby;
  const items = Array.isArray(raw) ? (raw as NearbyLike[]) : [];
  const clean = items
    .map((n) => ({
      name: String(n.name ?? n.place ?? ""),
      category: String(n.category ?? n.type ?? ""),
      distance: String(n.distance ?? ""),
    }))
    .filter((n) => n.name);
  if (!clean.length) return null;

  return (
    <Section className="hrc-section">
      <SectionHeading eyebrow="Neighborhood" title="What's Nearby" />
      <UnderlineRule />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {clean.map((n) => (
          <div
            key={n.name + n.distance}
            className="flex items-start gap-3 rounded-xl border border-[color:var(--mist)] bg-white p-4"
          >
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--ivory)] text-[color:var(--gold)]">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-[color:var(--navy)]">
                {n.name}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {[n.category, n.distance].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- faqs

function FaqSection({ project }: { project: Project }) {
  const raw = (project as unknown as { faqs?: unknown }).faqs;
  const items = Array.isArray(raw) ? (raw as FaqLike[]) : [];
  const clean = items
    .map((f) => ({
      question: String(f.question ?? f.q ?? ""),
      answer: String(f.answer ?? f.a ?? ""),
    }))
    .filter((f) => f.question && f.answer);
  const [open, setOpen] = useState<number | null>(0);
  if (!clean.length) return null;
  return (
    <Section alt className="hrc-section">
      <SectionHeading
        eyebrow="Frequently asked"
        title="Questions & Answers"
      />
      <UnderlineRule />
      <div className="mx-auto mt-10 max-w-3xl space-y-3">
        {clean.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.question}
              className="overflow-hidden rounded-xl border border-[color:var(--mist)] bg-white"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium text-[color:var(--navy)]">
                  {f.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-[color:var(--gold)] transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen ? (
                <div
                  className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: f.answer }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- CTA

function EnquireCta({
  project,
  phone,
}: {
  project: Project;
  phone: string;
}) {
  const { open: openEnquiry } = useEnquiry();
  return (
    <section
      id="enquire"
      className="relative isolate overflow-hidden bg-[color:var(--navy)] py-16 text-white md:py-24"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(600px 300px at 20% 20%, rgba(201,169,97,.2), transparent 60%), radial-gradient(600px 300px at 80% 80%, rgba(201,169,97,.15), transparent 60%)",
        }}
      />
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--gold)]">
              Let's talk
            </div>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight md:text-4xl">
              Ready to call {project.title} home?
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75">
              Speak with a senior advisor for pricing negotiations, unit
              shortlists and priority site visits. RERA-compliant. Zero
              brokerage.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[color:var(--gold)]" />
                RERA-compliant advisory
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[color:var(--gold)]" />
                Zero brokerage
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="gold" size="lg" className="w-full" onClick={() => openEnquiry({ project: project.title })}><Mail className="mr-2 h-4 w-4" />
                Enquire Now</Button>
            <Button variant="hero-outline" size="lg" className="w-full" onClick={() => openEnquiry({ project: project.title })}><CalendarCheck className="mr-2 h-4 w-4" />
                Book Site Visit</Button>
            <Button asChild variant="hero-outline" size="lg" className="w-full">
              <a href={`tel:${phone.replace(/\s/g, "")}`}>
                <Phone className="mr-2 h-4 w-4" />
                {phone}
              </a>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ---------------------------------------------------------------- mobile bar

function MobileStickyBar({
  telUrl,
  whatsappUrl,
  phone: _phone,
}: {
  telUrl: string;
  whatsappUrl: string;
  phone: string;
}) {
  const { open: openEnquiry } = useEnquiry();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--mist)] bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        <a
          href={telUrl}
          className="flex flex-col items-center gap-1 py-3 text-[11px] font-semibold text-[color:var(--navy)]"
        >
          <Phone className="h-4 w-4 text-[color:var(--gold)]" />
          Call
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 py-3 text-[11px] font-semibold text-[color:var(--navy)]"
        >
          <MessageCircle className="h-4 w-4 text-[color:var(--gold)]" />
          WhatsApp
        </a>
        <button type="button" onClick={() => openEnquiry()} className="flex flex-col items-center gap-1 py-3 text-[11px] font-semibold text-[color:var(--navy)]">
          <CalendarCheck className="h-4 w-4 text-[color:var(--gold)]" />
          Book Visit
        </button>
        <button type="button" onClick={() => openEnquiry()} className="flex flex-col items-center gap-1 bg-[color:var(--gold)] py-3 text-[11px] font-semibold text-[color:var(--navy)]">
          <Send className="h-4 w-4" />
          Enquire
        </button>
      </div>
    </div>
  );
}

// silence unused import warning if navigate/motion trees change
export const _unused = { useNavigate };
