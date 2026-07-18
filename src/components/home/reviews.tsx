import { Quote } from "lucide-react";

import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Rating } from "@/components/ui/rating";
import { useReviews } from "@/hooks/queries";

/**
 * Reviews — customer testimonials. Wired to /reviews. Falls back to a
 * "coming soon" empty state when the API returns an empty list.
 */
export function Reviews() {
  const { data, isLoading } = useReviews();
  const items = data ?? [];

  return (
    <Section id="reviews">
      <SectionHeading
        eyebrow="Loved by 1,200+ Home Owners"
        title="What our customers say"
        subtitle="Real stories from families who found their dream homes with us."
      />

      {isLoading ? (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-[var(--radius)] bg-[color:var(--mist)]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 rounded-[var(--radius)] border border-dashed border-[color:var(--border)] bg-white p-12 text-center">
          <Quote className="h-8 w-8 text-[color:var(--gold)]" />
          <p className="max-w-md text-sm text-muted-foreground">
            New reviews are on the way. Meanwhile, our advisors are ready to
            help you find the right home.
          </p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <figure
              key={r.id}
              className="flex flex-col gap-5 rounded-[var(--radius)] border border-[color:var(--border)] bg-white p-6 shadow-[var(--shadow-soft)]"
            >
              <Quote className="h-7 w-7 text-[color:var(--gold)]" />
              <blockquote className="text-[15px] leading-relaxed text-[color:var(--ink)]">
                “{r.content}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-[color:var(--border)] pt-4">
                {r.avatar ? (
                  <img
                    src={r.avatar}
                    alt={r.author}
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--mist)] font-serif text-lg font-semibold text-[color:var(--navy)]">
                    {r.author?.[0]?.toUpperCase() ?? "H"}
                  </span>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-[color:var(--navy)]">
                    {r.author}
                  </span>
                  <Rating value={r.rating ?? 5} size={14} />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
}
