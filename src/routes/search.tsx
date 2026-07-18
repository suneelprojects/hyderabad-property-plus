import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  ArrowRight,
  Crown,
  Eye,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { useLocations, useMeta, useSearchQuery } from "@/hooks/queries";
import type { Project } from "@/types/hrc";
import { cn } from "@/lib/utils";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80";

const PER_PAGE = 6;

const searchSchema = z.object({
  location: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
  bhk: fallback(z.string(), "").default(""),
  budget: fallback(z.string(), "").default(""),
  view: fallback(z.enum(["grid", "list"]), "list").default("list"),
  page: fallback(z.number().int(), 1).default(1),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Search Properties — Hyderabad Realty Choices" },
      {
        name: "description",
        content:
          "Search premium residential properties across Hyderabad by location, property type, flat type, budget and keyword.",
      },
      {
        property: "og:title",
        content: "Search Properties — Hyderabad Realty Choices",
      },
      {
        property: "og:description",
        content:
          "Find your dream home — filter by location, property type, flat type and budget.",
      },
    ],
  }),
  component: SearchPage,
});

function projectImage(p: Project): string {
  if (typeof p.featured_image === "string" && p.featured_image)
    return p.featured_image;
  if (p.gallery?.length) return p.gallery[0];
  return FALLBACK_IMG;
}

function priceLabel(p: Project): string {
  if (!p.price_from) return "On Request";
  if (typeof p.price_from === "number") return `₹ ${p.price_from}`;
  return String(p.price_from);
}

function SearchPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });

  const { data: locations } = useLocations();
  const { data: meta } = useMeta();

  const apiParams = useMemo(
    () => ({
      location: search.location || undefined,
      type: search.type || undefined,
      bhk: search.bhk || undefined,
      budget: search.budget || undefined,
      q: search.q || undefined,
    }),
    [search.location, search.type, search.bhk, search.budget, search.q],
  );

  const {
    data: result,
    isLoading,
    isError,
    refetch,
  } = useSearchQuery(apiParams);

  const items = result?.items ?? [];

  // Client-side budget refinement in case the API doesn't filter it
  const budgetRange = useMemo(() => {
    if (!search.budget) return null;
    const b = meta?.filters?.budget?.find(
      (x) =>
        String(x.label) === search.budget ||
        `${x.min}-${x.max}` === search.budget,
    );
    return b ?? null;
  }, [search.budget, meta]);

  const filtered = useMemo(() => {
    if (!budgetRange) return items;
    return items.filter((p) => {
      const n =
        typeof p.price_from === "number"
          ? p.price_from
          : Number(String(p.price_from ?? "").replace(/[^\d.]/g, ""));
      if (!Number.isFinite(n) || n === 0) return true;
      return n >= budgetRange.min && n <= budgetRange.max;
    });
  }, [items, budgetRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(Math.max(1, search.page), totalPages);
  const pageStart = (page - 1) * PER_PAGE;
  const pageItems = filtered.slice(pageStart, pageStart + PER_PAGE);

  const hasFilters = Boolean(
    search.location ||
      search.q ||
      search.type ||
      search.bhk ||
      search.budget,
  );

  const setSearch = (
    updater: (prev: typeof search) => Partial<typeof search>,
  ) => {
    navigate({
      search: (prev: typeof search) => ({ ...prev, ...updater(prev), page: 1 }),
    });
  };

  const goToPage = (n: number) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, page: n }) });
    if (typeof window !== "undefined")
      window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const resetFilters = () =>
    navigate({
      search: () => ({
        location: "",
        q: "",
        type: "",
        bhk: "",
        budget: "",
        view: search.view,
        page: 1,
      }),
    });

  const setView = (view: "grid" | "list") =>
    navigate({ search: (prev: typeof search) => ({ ...prev, view }) });

  return (
    <PageShell
      eyebrow="Search"
      title="Find Your Home"
      subtitle="Search across every verified development in Hyderabad."
    >
      {/* Filter card */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          setSearch(() => ({
            location: String(fd.get("location") ?? ""),
            q: String(fd.get("q") ?? ""),
            type: String(fd.get("type") ?? ""),
            bhk: String(fd.get("bhk") ?? ""),
            budget: String(fd.get("budget") ?? ""),
          }));
        }}
        className="mb-8 rounded-[var(--radius)] bg-white p-5 shadow-[var(--shadow-soft)] md:p-6"
      >
        <div className="mb-4 flex items-center gap-2 text-[color:var(--navy)]">
          <SlidersHorizontal className="h-4 w-4 text-[color:var(--gold)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">
            Refine Search
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FieldSelect
            label="Location"
            name="location"
            defaultValue={search.location}
            options={[
              { value: "", label: "Any Location" },
              ...(locations ?? []).map((l) => ({
                value: l.slug,
                label: l.title,
              })),
            ]}
          />

          <FieldSelect
            label="Property Type"
            name="type"
            defaultValue={search.type}
            options={[
              { value: "", label: "Any Type" },
              ...(meta?.filters?.property_types ?? []).map((v) => ({
                value: v,
                label: v,
              })),
            ]}
          />

          <FieldSelect
            label="Flat Type"
            name="bhk"
            defaultValue={search.bhk}
            options={[
              { value: "", label: "Any BHK" },
              ...(meta?.filters?.bhk ?? []).map((v) => ({
                value: v,
                label: v,
              })),
            ]}
          />

          <FieldSelect
            label="Budget"
            name="budget"
            defaultValue={search.budget}
            options={[
              { value: "", label: "Any Budget" },
              ...(meta?.filters?.budget ?? []).map((b) => ({
                value: b.label,
                label: b.label,
              })),
            ]}
          />

          <FieldInput
            label="Keyword"
            name="q"
            defaultValue={search.q}
            placeholder="Project name, builder…"
            icon={<SearchIcon className="h-4 w-4 text-[color:var(--gold)]" />}
          />

          <div className="flex items-end">
            <Button type="submit" className="w-full">
              Search
            </Button>
          </div>
        </div>

        {hasFilters ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[color:var(--border)] pt-4">
            <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Active:
            </span>
            {search.location ? (
              <Chip
                label={
                  locations?.find((l) => l.slug === search.location)?.title ??
                  search.location
                }
                onClear={() => setSearch(() => ({ location: "" }))}
              />
            ) : null}
            {search.type ? (
              <Chip
                label={search.type}
                onClear={() => setSearch(() => ({ type: "" }))}
              />
            ) : null}
            {search.bhk ? (
              <Chip
                label={search.bhk}
                onClear={() => setSearch(() => ({ bhk: "" }))}
              />
            ) : null}
            {search.budget ? (
              <Chip
                label={search.budget}
                onClear={() => setSearch(() => ({ budget: "" }))}
              />
            ) : null}
            {search.q ? (
              <Chip
                label={`"${search.q}"`}
                onClear={() => setSearch(() => ({ q: "" }))}
              />
            ) : null}
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--gold-2)] hover:text-[color:var(--navy)]"
            >
              Reset all
            </button>
          </div>
        ) : null}
      </form>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Searching…"
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold text-[color:var(--navy)]">
                {filtered.length === 0
                  ? 0
                  : `${pageStart + 1}–${Math.min(
                      pageStart + PER_PAGE,
                      filtered.length,
                    )}`}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[color:var(--navy)]">
                {filtered.length}
              </span>{" "}
              results
            </>
          )}
        </p>

        <div className="inline-flex overflow-hidden rounded-full border border-[color:var(--border)] bg-white p-1">
          <ViewButton
            active={search.view === "list"}
            onClick={() => setView("list")}
            label="List"
            icon={<List className="h-4 w-4" />}
          />
          <ViewButton
            active={search.view === "grid"}
            onClick={() => setView("grid")}
            label="Grid"
            icon={<LayoutGrid className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Results */}
      {isError ? (
        <ErrorState
          action={
            <Button onClick={() => refetch()} variant="outline">
              Try again
            </Button>
          }
        />
      ) : isLoading ? (
        <div
          className={cn(
            search.view === "grid"
              ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-6",
          )}
        >
          {Array.from({ length: search.view === "grid" ? 6 : 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "animate-pulse rounded-[var(--radius)] bg-white",
                search.view === "grid" ? "h-[420px]" : "h-[300px]",
              )}
            />
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <EmptyState
          icon={<SearchIcon className="h-8 w-8" />}
          title="No properties match your search"
          description="Try widening your criteria — remove a filter or explore all developments."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={resetFilters} variant="outline">
                Clear filters
              </Button>
              <Button asChild>
                <Link to="/projects">Browse all projects</Link>
              </Button>
            </div>
          }
        />
      ) : search.view === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pageItems.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              whatsapp={meta?.whatsapp || meta?.phone}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && !isLoading ? (
        <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
      ) : null}
    </PageShell>
  );
}

/* ---------- Sub-components ---------- */

function FieldInput({
  label,
  name,
  defaultValue,
  placeholder,
  icon,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--gold-2)]">
        {label}
      </span>
      <span className="relative flex items-center">
        {icon ? (
          <span className="pointer-events-none absolute left-3">{icon}</span>
        ) : null}
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn("hrc-input", icon && "pl-9")}
        />
      </span>
    </label>
  );
}

function FieldSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--gold-2)]">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="hrc-input hrc-select"
      >
        {options.map((o) => (
          <option key={o.value + o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/10 px-3 py-1 text-xs font-medium text-[color:var(--gold-2)]">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 hover:bg-[color:var(--gold)]/20"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
        active
          ? "bg-[color:var(--navy)] text-white"
          : "text-muted-foreground hover:text-[color:var(--navy)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (n: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: (number | "…")[] = [];
    const push = (n: number | "…") => arr.push(n);
    const range = (a: number, b: number) => {
      for (let i = a; i <= b; i++) push(i);
    };
    if (totalPages <= 7) {
      range(1, totalPages);
    } else {
      push(1);
      if (page > 3) push("…");
      range(Math.max(2, page - 1), Math.min(totalPages - 1, page + 1));
      if (page < totalPages - 2) push("…");
      push(totalPages);
    }
    return arr;
  }, [page, totalPages]);

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white px-4 text-sm font-medium text-[color:var(--navy)] transition-colors hover:border-[color:var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowRight className="h-4 w-4 rotate-180" />
        Prev
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
              p === page
                ? "border-[color:var(--navy)] bg-[color:var(--navy)] text-white"
                : "border-[color:var(--border)] bg-white text-[color:var(--navy)] hover:border-[color:var(--gold)]",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-white px-4 text-sm font-medium text-[color:var(--navy)] transition-colors hover:border-[color:var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
        <ArrowRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

/* ---------- Card + Row ---------- */

function WhatsAppIcon({ className }: { className?: string }) {
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

function ProjectRow({
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

function ProjectCard({ project }: { project: Project }) {
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
