import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-cards";
import { useMeta, useProjects } from "@/hooks/queries";
import { SALES_WHATSAPP_NUMBER } from "@/lib/whatsapp";

/**
 * FeaturedProjects — homepage showcase. Uses the shared compact ProjectCard
 * so any card design change propagates automatically across Home, Projects,
 * Locations, and Search.
 */
export function FeaturedProjects() {
  const { data, isLoading } = useProjects();
  const { data: meta } = useMeta();
  const items = (data ?? []).slice(0, 6);
  const whatsapp = SALES_WHATSAPP_NUMBER;

  return (
    <Section id="projects" className="bg-[color:var(--ivory)]">
      <SectionHeading
        eyebrow="Featured Projects"
        title="Signature residences, curated for you"
        subtitle="From skyline penthouses to lakeside villas — a hand-picked showcase of Hyderabad's most refined developments."
      />

      <div className="mt-14">
        {isLoading && !items.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-[20px] bg-white/70"
              />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <ProjectCard key={p.id} project={p} whatsapp={whatsapp} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-14 text-center">
        <Button variant="outline" size="lg" asChild className="rounded-full">
          <Link to="/projects">
            Explore all projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
