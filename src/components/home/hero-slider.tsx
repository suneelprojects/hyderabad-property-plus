import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { useSlides } from "@/hooks/queries";
import type { Slide } from "@/types/hrc";
import { cn } from "@/lib/utils";

const FALLBACK: Slide[] = [
  {
    id: -1,
    title: "Building Your Dream Home Journey",
    subheading:
      "Delivering a seamless property discovery experience with verified listings, expert consultation, and personalized support from search to possession.",
    bg_url:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80",
    button_text: "Explore Projects",
    button_url: "/projects",
  },
];

/**
 * HeroSlider — full-viewport hero with fade-cross slides, eyebrow, big serif
 * title, subheading, CTA, and prev/next arrows. Wired to /slides.
 */
export function HeroSlider() {
  const { data, isLoading } = useSlides();
  const slides = data && data.length ? data : FALLBACK;
  const [index, setIndex] = useState(0);

  const count = slides.length;
  const active = slides[index % count];

  // Autoplay every 6s (paused if only 1 slide)
  useEffect(() => {
    if (count <= 1) return;
    const t = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      6000,
    );
    return () => window.clearInterval(t);
  }, [count]);

  const go = (delta: number) =>
    setIndex((i) => (i + delta + count) % count);

  return (
    <section className="relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden bg-[color:var(--navy)] text-white">
      {/* Slides */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={active.bg_url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: "var(--gradient-hero)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <Container className="relative z-10 flex h-full items-center">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
              className="flex flex-col gap-6"
            >
              <Eyebrow className="text-[color:var(--gold)]">
                Hyderabad Realty Choices
              </Eyebrow>
              <h1 className="font-serif text-[40px] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-[56px] lg:text-[64px]">
                {active.title}
              </h1>
              {active.subheading ? (
                <p className="max-w-xl text-[17px] leading-relaxed text-white/85">
                  {active.subheading}
                </p>
              ) : null}
              {active.button_text ? (
                <div className="pt-2">
                  <Button
                    variant="gold"
                    size="lg"
                    asChild
                    className="rounded-full"
                  >
                    <a href={active.button_url || "#projects"}>
                      {active.button_text}
                    </a>
                  </Button>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>

      {/* Arrows */}
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:left-8"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/30 bg-white/10 p-3 text-white backdrop-blur-md transition-colors hover:bg-white/20 md:right-8"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-32 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-40 md:left-[max(24px,calc(50%-576px+24px))] md:translate-x-0">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === index
                    ? "w-10 bg-[color:var(--gold)]"
                    : "w-5 bg-white/40 hover:bg-white/70",
                )}
              />
            ))}
          </div>
        </>
      ) : null}

      {isLoading ? (
        <div className="absolute inset-0 bg-[color:var(--navy)]/60" />
      ) : null}
    </section>
  );
}
