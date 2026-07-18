import { BadgeCheck, MapPinned, ShieldCheck, UserRound } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Eyebrow } from "@/components/ui/eyebrow";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "RERA-verified",
    body: "Every project we list is verified and RERA-compliant.",
  },
  {
    icon: UserRound,
    title: "Personal advisor",
    body: "Dedicated realtor for the entire journey.",
  },
  {
    icon: BadgeCheck,
    title: "Best price guarantee",
    body: "Direct-from-builder pricing without hidden charges.",
  },
  {
    icon: MapPinned,
    title: "Neighborhood expertise",
    body: "Insider knowledge of every micro-market.",
  },
];

/**
 * WhyChoose — navy value-prop band with a two-column heading + 4-feature
 * grid, mirroring the live "concierge for premium property" section.
 */
export function WhyChoose() {
  return (
    <section className="bg-[color:var(--navy)] py-20 text-white md:py-24">
      <Container>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <div className="flex flex-col gap-5">
            <Eyebrow className="text-[color:var(--gold)]">
              Why Hyderabad Realty Choices
            </Eyebrow>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-white md:text-[40px]">
              A concierge for premium property in Hyderabad
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-white/75">
              Curated inventory, transparent pricing, and a dedicated advisor
              from first visit to key handover.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {f.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">
                      {f.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
