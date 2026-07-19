import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { LuxuryShowcase } from "@/components/projects/luxury-showcase";
import { useMeta, useProjects } from "@/hooks/queries";

/**
 * FeaturedProjects — luxury brochure-style showcase. Full-width carousel that
 * spotlights one development at a time with a 55/45 image-to-detail split,
 * autoplay, arrows, dots, and swipe. Warm ivory backdrop with generous
 * whitespace.
 */
export function FeaturedProjects() {
  const { data, isLoading } = useProjects();
  const { data: meta } = useMeta();
  const items = (data ?? []).slice(0, 6);

  return (
    <Section id="projects" className="bg-[color:var(--ivory)]">
      <SectionHeading
        eyebrow="Featured Projects"
        title="Signature residences, curated for you"
        subtitle="From skyline penthouses to lakeside villas — a hand-picked showcase of Hyderabad's most refined developments."
      />

      <div className="mt-14">
        {isLoading && !items.length ? (
          <div className="h-[560px] animate-pulse rounded-[28px] bg-white/70" />
        ) : items.length ? (
          <LuxuryShowcase
            projects={items}
            whatsapp={meta?.whatsapp || meta?.phone}
          />
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
