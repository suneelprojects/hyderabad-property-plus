import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bed, Home, IndianRupee, MapPin, Search } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { useLocations, useMeta } from "@/hooks/queries";

/**
 * QuickSearch — the ivory floating search card that overlaps the hero.
 * Fields: Location, Project/keyword, BHK, Budget → routes to /projects with
 * query params. Mirrors the live "Buy" tab.
 */
export function QuickSearch() {
  const { data: meta } = useMeta();
  const { data: locations } = useLocations();
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [q, setQ] = useState("");
  const [bhk, setBhk] = useState("");
  const [budget, setBudget] = useState("");

  const bhkOptions = meta?.filters?.bhk ?? [];
  const budgetOptions = meta?.filters?.budget ?? [];

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const search: Record<string, string> = {};
    if (location) search.location = location;
    if (q) search.q = q;
    if (bhk) search.bhk = bhk;
    if (budget) search.budget = budget;
    navigate({ to: "/projects", search });
  };

  return (
    <div className="relative z-20 -mt-24 md:-mt-28">
      <Container>
        <form
          onSubmit={onSubmit}
          className="rounded-[var(--radius)] bg-white p-4 shadow-[var(--shadow-lift)] md:p-6"
        >
          {/* Tabs */}
          <div className="mb-4 flex gap-6 border-b border-[color:var(--border)]">
            <button
              type="button"
              className="flex items-center gap-2 border-b-2 border-[color:var(--gold)] px-1 pb-3 text-sm font-semibold text-[color:var(--navy)]"
            >
              <Home className="h-4 w-4 text-[color:var(--gold)]" />
              Buy
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_1.5fr_1fr_1.2fr_auto]">
            <Field icon={<MapPin className="h-4 w-4" />} label="LOCATION">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="hrc-select"
              >
                <option value="">Any Location</option>
                {(locations ?? []).map((l) => (
                  <option key={l.id} value={l.slug}>
                    {l.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field icon={<Search className="h-4 w-4" />} label="PROJECT / SOCIETY">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search project or keyword…"
                className="hrc-select"
              />
            </Field>

            <Field icon={<Bed className="h-4 w-4" />} label="BHK">
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="hrc-select"
              >
                <option value="">Any BHK</option>
                {bhkOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            <Field icon={<IndianRupee className="h-4 w-4" />} label="BUDGET">
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="hrc-select"
              >
                <option value="">Any Budget</option>
                {budgetOptions.map((b) => (
                  <option key={b.label} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="rounded-[var(--radius)] md:h-full md:px-8"
            >
              <Search className="h-4 w-4" />
              Search Properties
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[color:var(--border)] bg-white px-3 py-2 transition-colors focus-within:border-[color:var(--gold)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[color:var(--mist)] text-[color:var(--navy)]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--gold-2)]">
          {label}
        </span>
        {children}
      </span>
    </label>
  );
}
