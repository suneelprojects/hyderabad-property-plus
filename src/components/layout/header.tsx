import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Building2, Calendar, Menu, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "./container";
import { MobileNav } from "./mobile-nav";
import { useMeta } from "@/hooks/queries";
import { useEnquiry } from "@/components/enquiry-modal";
import { cn } from "@/lib/utils";
import { SALES_PHONE_TEL, SALES_PHONE_DISPLAY } from "@/lib/whatsapp";

interface NavItem {
  label: string;
  to: string;
}

const NAV: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Locations", to: "/locations" },
  { label: "Projects", to: "/projects" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/**
 * Header — sticky. Transparent over the hero, then navy/white with a soft
 * shadow after scrolling past 40px. Matches the live `.hrc-header` behaviour.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const { data: meta } = useMeta();
  const { open: openEnquiry } = useEnquiry();

  const isHome = pathname === "/";
  const overHero = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: overHero ? "rgba(10,31,68,0)" : "rgba(255,255,255,1)",
        boxShadow: overHero ? "0 0 0 rgba(0,0,0,0)" : "var(--shadow-soft)",
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full",
        overHero ? "text-white" : "text-[color:var(--navy)]",
      )}
      data-over-hero={overHero ? "true" : "false"}
    >
      <Container>
        <div className="flex h-[72px] items-center justify-between gap-6">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Hyderabad Realty Choices — Home"
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-[10px] border transition-colors",
                overHero
                  ? "border-white/40 bg-white/10 backdrop-blur-sm"
                  : "border-[color:var(--border)] bg-[color:var(--mist)]",
              )}
            >
              <Building2
                className={cn(
                  "h-5 w-5",
                  overHero ? "text-white" : "text-[color:var(--navy)]",
                )}
              />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span
                className={cn(
                  "font-serif text-lg font-semibold tracking-tight",
                  overHero ? "text-white" : "text-[color:var(--navy)]",
                )}
              >
                Hyderabad Realty Choices
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.2em]",
                  overHero ? "text-white/70" : "text-[color:var(--gold-2)]",
                )}
              >
                Luxury Homes · Trusted Choices
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative px-3.5 py-2 text-sm font-medium transition-colors",
                    overHero
                      ? "text-white/90 hover:text-white"
                      : "text-[color:var(--navy)]/85 hover:text-[color:var(--navy)]",
                  )}
                >
                  {item.label}
                  {active ? (
                    <motion.span
                      layoutId="hrc-nav-active"
                      className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-[color:var(--gold)]"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* CTA cluster */}
          <div className="flex items-center gap-2">
            {true ? (
              <a
                href={SALES_PHONE_TEL}
                className={cn(
                  "hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors md:inline-flex",
                  overHero
                    ? "border-white/40 bg-white/10 text-white hover:bg-white hover:text-[color:var(--navy)]"
                    : "border-[color:var(--border)] bg-white text-[color:var(--navy)] hover:border-[color:var(--gold)]",
                )}
              >
                <Phone className="h-4 w-4" />
                Call Now
              </a>
            ) : null}
            <Button
              variant="gold"
              size="pill"
              onClick={() => openEnquiry()}
              className="hidden md:inline-flex"
            >
              <Calendar className="h-4 w-4" />
              Book Site Visit
            </Button>

            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-[10px] border transition-colors lg:hidden",
                overHero
                  ? "border-white/40 bg-white/10 text-white"
                  : "border-[color:var(--border)] bg-white text-[color:var(--navy)]",
              )}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Container>

      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        items={NAV}
        activePath={pathname}
      />
    </motion.header>
  );
}
