import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, X } from "lucide-react";

import { useMeta } from "@/hooks/queries";
import { projectQueryOptions, locationQueryOptions } from "@/hooks/queries/options";
import { buildWaLink, WA_MESSAGES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Global floating WhatsApp button.
 *
 * - Fixed bottom-right, visible on every page.
 * - Auto-expands a "Chat with our Property Expert" tooltip a few seconds
 *   after mount and on hover; user can dismiss it.
 * - Message is context-aware:
 *     /projects/:slug  → includes project name
 *     /locations/:slug → includes location name
 *     everything else  → generic homepage message
 * - Fires a `whatsapp_click` analytics event (dataLayer + custom event) so
 *   any GA4 / GTM / Plausible listener can pick it up.
 */
export function FloatingWhatsApp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: meta } = useMeta();

  const projectMatch = pathname.match(/^\/projects\/([^/]+)$/);
  const locationMatch = pathname.match(/^\/locations\/([^/]+)$/);

  const { data: project } = useQuery({
    ...projectQueryOptions(projectMatch?.[1] ?? ""),
    enabled: !!projectMatch,
  });
  const { data: location } = useQuery({
    ...locationQueryOptions(locationMatch?.[1] ?? ""),
    enabled: !!locationMatch,
  });

  const message = React.useMemo(() => {
    if (projectMatch) {
      const name = project?.title ?? toTitle(projectMatch[1]);
      return WA_MESSAGES.project(name);
    }
    if (locationMatch) {
      const name = location?.title ?? toTitle(locationMatch[1]);
      return WA_MESSAGES.location(name);
    }
    return WA_MESSAGES.home();
  }, [projectMatch, locationMatch, project?.title, location?.title]);

  // Floating WhatsApp CTA routes to the dedicated sales number regardless of /meta.
  const FLOATING_WA_NUMBER = "918247766377";
  const href = buildWaLink({ phone: FLOATING_WA_NUMBER, text: message });

  // Tooltip auto-reveal, once per session.
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("hrc-wa-tooltip-dismissed") === "1") {
      setDismissed(true);
      return;
    }
    const t = window.setTimeout(() => setTooltipOpen(true), 3500);
    return () => window.clearTimeout(t);
  }, []);

  const dismissTooltip = React.useCallback(() => {
    setTooltipOpen(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("hrc-wa-tooltip-dismissed", "1");
    }
  }, []);

  const handleClick = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const payload = {
      event: "whatsapp_click",
      wa_context: projectMatch
        ? "project"
        : locationMatch
          ? "location"
          : "home",
      wa_subject: projectMatch
        ? (project?.title ?? projectMatch[1])
        : locationMatch
          ? (location?.title ?? locationMatch[1])
          : "generic",
      wa_path: pathname,
    };
    // GTM / GA4 dataLayer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (Array.isArray(w.dataLayer)) w.dataLayer.push(payload);
    // Generic custom event for anything else listening
    window.dispatchEvent(new CustomEvent("hrc:whatsapp_click", { detail: payload }));
  }, [pathname, projectMatch, locationMatch, project?.title, location?.title]);

  return (
    <div
      className={cn(
        "fixed z-[60] flex items-end gap-2 print:hidden",
        // Extra bottom offset on mobile project pages that have a sticky bar.
        "right-4 bottom-4 sm:right-6 sm:bottom-6",
      )}
      style={{
        bottom:
          "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
      onMouseEnter={() => !dismissed && setTooltipOpen(true)}
    >
      <AnimatePresence>
        {tooltipOpen ? (
          <motion.div
            key="tip"
            initial={{ opacity: 0, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mb-1 hidden items-center gap-2 rounded-full bg-[var(--navy)] px-4 py-2.5 pr-3 text-white shadow-[0_10px_30px_rgba(10,31,68,0.35)] sm:flex"
          >
            <span className="text-[13px] font-medium leading-none">
              Chat with our Property Expert
            </span>
            <button
              type="button"
              onClick={dismissTooltip}
              aria-label="Dismiss"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        aria-label="Chat with our Property Expert on WhatsApp"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          "relative inline-flex h-14 w-14 items-center justify-center rounded-full",
          "bg-[#25D366] text-white",
          "shadow-[0_12px_30px_rgba(37,211,102,0.45)]",
          "ring-2 ring-[var(--gold)]/70 ring-offset-2 ring-offset-transparent",
          "transition-shadow hover:shadow-[0_16px_40px_rgba(37,211,102,0.6)]",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--gold)]",
        )}
      >
        {/* Pulse halo */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping"
          style={{ animationDuration: "2.4s" }}
        />
        <MessageCircle className="relative h-6 w-6" strokeWidth={2.2} />
      </motion.a>
    </div>
  );
}

function toTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default FloatingWhatsApp;
