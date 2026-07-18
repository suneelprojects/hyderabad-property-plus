import { createFileRoute } from "@tanstack/react-router";

import { HeroSlider } from "@/components/home/hero-slider";
import { QuickSearch } from "@/components/home/quick-search";
import { FeaturedLocations } from "@/components/home/featured-locations";
import { FeaturedProjects } from "@/components/home/featured-projects";
import { Reviews } from "@/components/home/reviews";
import { WhyChoose } from "@/components/home/why-choose";
import { ContactCta } from "@/components/home/contact-cta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Hyderabad Realty Choices — Luxury Homes & Trusted Real Estate",
      },
      {
        name: "description",
        content:
          "Premium residential projects across Hyderabad — Financial District, Kokapet, Gachibowli and more. Curated inventory, RERA-verified projects, and a dedicated advisor from first visit to key handover.",
      },
      {
        property: "og:title",
        content:
          "Hyderabad Realty Choices — Luxury Homes & Trusted Real Estate",
      },
      {
        property: "og:description",
        content:
          "Curated inventory, transparent pricing, and a dedicated advisor for every buyer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <HeroSlider />
      <QuickSearch />
      <FeaturedLocations />
      <FeaturedProjects />
      <Reviews />
      <WhyChoose />
      <ContactCta />
    </>
  );
}
