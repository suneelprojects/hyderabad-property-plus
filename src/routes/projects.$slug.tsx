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
      />
      <QuickFacts project={project} />
      <ProjectOverview project={project} telUrl={telUrl} />
      <PriceInformation project={project} telUrl={telUrl} />
      <AvailableFlats project={project} />
      <AmenitiesSection project={project} />
      <SpecificationsSection project={project} />
      <NearbySection project={project} />
      <FaqSection project={project} />
      <EnquireCta project={project} phone={phone} />
      <MobileStickyBar
        telUrl={telUrl}
        whatsappUrl={whatsappUrl}
      />
    </>
  );
}

// ---------------------------------------------------------------- hero

function ProjectHero({
  project,
  heroImage,
  crumbs,
  telUrl,
}: {
  project: Project;
  heroImage: string;
  crumbs: Crumb[];
  telUrl: string;
}) {
}) {
  const { open: openEnquiry } = useEnquiry();
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
          <Button asChild variant="gold" size="lg">
            <a href="#enquire">
              <CalendarCheck className="mr-2 h-4 w-4" />
              Book Site Visit
            </a>
          </Button>
          {(project as unknown as { brochure_url?: string }).brochure_url ? (
            <Button asChild variant="hero-outline" size="lg">
              <a
                href={(project as unknown as { brochure_url?: string }).brochure_url as string}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Brochure
              </a>
            </Button>
          ) : (
            <Button asChild variant="hero-outline" size="lg">
              <a href="#enquire">
                <Download className="mr-2 h-4 w-4" />
                Download Brochure
              </a>
            </Button>
          )}
          <Button asChild variant="hero-outline" size="lg">
            <a href={telUrl}>
              <Headphones className="mr-2 h-4 w-4" />
              Call Advisor
            </a>
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
  telUrl,
}: {
  project: Project;
  telUrl: string;
}) {
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
        <Button asChild variant="gold" size="lg">
          <a href={telUrl}>
            <Headphones className="mr-2 h-4 w-4" />
            Talk to Advisor
          </a>
        </Button>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------- price

function PriceInformation({
  project,
  telUrl,
}: {
  project: Project;
  telUrl: string;
}) {
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
        <Button asChild variant="gold" size="lg">
          <a href="#enquire">
            <CalendarCheck className="mr-2 h-4 w-4" />
            Book Site Visit
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="#enquire">
            <Download className="mr-2 h-4 w-4" />
            Download Brochure
          </a>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <a href={telUrl}>
            <Headphones className="mr-2 h-4 w-4" />
            Talk to Advisor
          </a>
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

  const [tower, setTower] = useState("");
  const [floor, setFloor] = useState("");
  const [bhk, setBhk] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");

  const towers = useMemo(() => {
    const set = new Set<string>();
    for (const f of flats) {
      const t = (f as unknown as { tower?: string }).tower;
      if (t) set.add(String(t));
    }
    return [...set].sort();
  }, [flats]);

  const bhkOptions = useMemo(() => {
    const set = new Set<string>();
    for (const f of flats) if (f.bhk) set.add(String(f.bhk));
    return [...set].sort();
  }, [flats]);

  const filtered = flats.filter((f) => {
    const rec = f as unknown as {
      tower?: string;
      floor?: number | string;
      status?: string;
    };
    if (tower && rec.tower !== tower) return false;
    if (bhk && f.bhk !== bhk) return false;
    if (status && (rec.status || "").toLowerCase() !== status.toLowerCase())
      return false;
    if (floor) {
      const min = Number(floor);
      const fl = Number(rec.floor ?? 0);
      if (!Number.isFinite(fl) || fl < min) return false;
    }
    if (area) {
      const min = Number(area);
      const size = Number(String(f.carpet_area || f.built_up_area || f.size || "").replace(/[^\d.]/g, ""));
      if (!Number.isFinite(size) || size < min) return false;
    }
    if (price) {
      const max = Number(price);
      const p = Number(String(f.price ?? "").replace(/[^\d.]/g, ""));
      if (!Number.isFinite(p) || p > max) return false;
    }
    return true;
  });

  const reset = () => {
    setTower(""); setFloor(""); setBhk(""); setArea(""); setPrice(""); setStatus("");
  };

  return (
    <Section alt className="hrc-section">
      <SectionHeading eyebrow="Live Inventory" title="Available Flats" />
      <UnderlineRule />
      <p className="mx-auto mt-4 max-w-2xl text-center text-[15px] text-muted-foreground">
        Real-time inventory with pricing. Filter to your ideal home — then talk
        to an advisor.
      </p>

      <div className="mt-10 rounded-2xl border border-[color:var(--mist)] bg-white p-5 shadow-[0_10px_40px_-24px_rgba(10,31,68,.2)] md:p-6">
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
          <FilterField label="Tower" icon={<Landmark className="h-4 w-4" />}>
            <select
              className="hrc-select"
              value={tower}
              onChange={(e) => setTower(e.target.value)}
            >
              <option value="">All Towers</option>
              {towers.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Floor" icon={<Layers className="h-4 w-4" />}>
            <select
              className="hrc-select"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            >
              <option value="">Any Floor</option>
              <option value="1">1+ (Low rise)</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
              <option value="15">15+ (High rise)</option>
              <option value="20">20+ (Sky homes)</option>
            </select>
          </FilterField>
          <FilterField label="BHK" icon={<HomeIcon className="h-4 w-4" />}>
            <select
              className="hrc-select"
              value={bhk}
              onChange={(e) => setBhk(e.target.value)}
            >
              <option value="">All Types</option>
              {bhkOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </FilterField>
          <FilterField
            label="Area (min sqft)"
            icon={<Ruler className="h-4 w-4" />}
          >
            <select
              className="hrc-select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Any Size</option>
              <option value="1500">1500+</option>
              <option value="2000">2000+</option>
              <option value="2500">2500+</option>
              <option value="3000">3000+</option>
              <option value="3500">3500+</option>
            </select>
          </FilterField>
          <FilterField label="Max Price" icon={<Wallet className="h-4 w-4" />}>
            <select
              className="hrc-select"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            >
              <option value="">Any Budget</option>
              <option value="20000000">Up to ₹ 2 Cr</option>
              <option value="30000000">Up to ₹ 3 Cr</option>
              <option value="40000000">Up to ₹ 4 Cr</option>
              <option value="50000000">Up to ₹ 5 Cr</option>
              <option value="100000000">Up to ₹ 10 Cr</option>
            </select>
          </FilterField>
          <FilterField label="Status" icon={<TagIcon className="h-4 w-4" />}>
            <select
              className="hrc-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Sold">Sold</option>
            </select>
          </FilterField>
          <div className="flex items-end">
            <button
              onClick={reset}
              type="button"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[color:var(--mist)] px-4 text-sm font-medium text-[color:var(--navy)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--mist)] bg-white/60 px-6 py-14 text-center text-sm text-muted-foreground">
            {flats.length === 0
              ? "No flats added for this project yet. Check back soon."
              : "No flats match your filters. Try widening your search."}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => <FlatCard key={f.id} flat={f} />)}
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

function FlatCard({ flat }: { flat: Flat }) {
  const rec = flat as unknown as { tower?: string; floor?: string | number; status?: string };
  return (
    <div className="group overflow-hidden rounded-2xl border border-[color:var(--mist)] bg-white shadow-[0_10px_40px_-24px_rgba(10,31,68,.25)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-30px_rgba(10,31,68,.35)]">
      {flat.floor_plan ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-[color:var(--ivory)]">
          <img
            src={flat.floor_plan}
            alt={`${flat.bhk} floor plan`}
            className="h-full w-full object-contain p-4 transition group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="font-serif text-lg font-semibold text-[color:var(--navy)]">
            {flat.bhk || "Unit"}
          </div>
          {rec.status ? (
            <span className="rounded-full bg-[color:var(--ivory)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--gold)]">
              {rec.status}
            </span>
          ) : null}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {rec.tower ? (
            <Fact label="Tower" value={rec.tower} />
          ) : null}
          {rec.floor != null && rec.floor !== "" ? (
            <Fact label="Floor" value={String(rec.floor)} />
          ) : null}
          {flat.size || flat.carpet_area || flat.built_up_area ? (
            <Fact
              label="Area"
              value={formatArea(flat.size || flat.carpet_area || flat.built_up_area)}
            />
          ) : null}
          {flat.facing ? <Fact label="Facing" value={flat.facing} /> : null}
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-[color:var(--mist)] pt-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Price
            </div>
            <div className="font-serif text-lg font-semibold text-[color:var(--gold)]">
              {flat.price ? formatPriceInr(flat.price) : "On Request"}
            </div>
          </div>
          <a
            href="#enquire"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--navy)] hover:text-[color:var(--gold)]"
          >
            Enquire <Send className="h-3.5 w-3.5" />
          </a>
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
            <Button asChild variant="gold" size="lg" className="w-full">
              <a href="#enquire">
                <Mail className="mr-2 h-4 w-4" />
                Enquire Now
              </a>
            </Button>
            <Button asChild variant="hero-outline" size="lg" className="w-full">
              <a href="#enquire">
                <CalendarCheck className="mr-2 h-4 w-4" />
                Book Site Visit
              </a>
            </Button>
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
}: {
  telUrl: string;
  whatsappUrl: string;
}) {
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
        <a
          href="#enquire"
          className="flex flex-col items-center gap-1 py-3 text-[11px] font-semibold text-[color:var(--navy)]"
        >
          <CalendarCheck className="h-4 w-4 text-[color:var(--gold)]" />
          Book Visit
        </a>
        <a
          href="#enquire"
          className="flex flex-col items-center gap-1 bg-[color:var(--gold)] py-3 text-[11px] font-semibold text-[color:var(--navy)]"
        >
          <Send className="h-4 w-4" />
          Enquire
        </a>
      </div>
    </div>
  );
}

// silence unused import warning if navigate/motion trees change
export const _unused = { useNavigate };
