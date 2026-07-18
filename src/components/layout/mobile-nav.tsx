import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Calendar, Mail, Phone, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMeta } from "@/hooks/queries";
import { cn } from "@/lib/utils";

interface Item {
  label: string;
  to: string;
}

/**
 * Mobile off-canvas navigation — slides in from the right, mirrors the
 * primary desktop navigation.
 */
export function MobileNav({
  open,
  onOpenChange,
  items,
  activePath,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: Item[];
  activePath: string;
}) {
  const { data: meta } = useMeta();

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-[color:var(--navy)]/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 z-[70] flex h-full w-[88%] max-w-sm flex-col bg-white text-[color:var(--navy)] shadow-[var(--shadow-lift)]"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between border-b border-[color:var(--border)] px-5 py-4">
              <span className="font-serif text-lg font-semibold">Menu</span>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[color:var(--border)] text-[color:var(--navy)] hover:bg-[color:var(--mist)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col">
                {items.map((item) => {
                  const active =
                    item.to === "/"
                      ? activePath === "/"
                      : activePath.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "flex items-center justify-between border-b border-[color:var(--border)] py-3.5 text-base font-medium transition-colors",
                          active
                            ? "text-[color:var(--gold-2)]"
                            : "text-[color:var(--navy)] hover:text-[color:var(--gold-2)]",
                        )}
                      >
                        <span>{item.label}</span>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            active
                              ? "bg-[color:var(--gold)]"
                              : "bg-[color:var(--mist)]",
                          )}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-[color:var(--border)] p-5">
              {meta?.phone ? (
                <a
                  href={`tel:${meta.phone.replace(/\s+/g, "")}`}
                  className="mb-3 flex items-center gap-3 text-sm font-semibold text-[color:var(--navy)]"
                >
                  <Phone className="h-4 w-4 text-[color:var(--gold)]" />
                  {meta.phone}
                </a>
              ) : null}
              {meta?.email ? (
                <a
                  href={`mailto:${meta.email}`}
                  className="mb-4 flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <Mail className="h-4 w-4 text-[color:var(--gold)]" />
                  {meta.email}
                </a>
              ) : null}
              <Button
                variant="gold"
                size="lg"
                asChild
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                <Link to="/contact">
                  <Calendar className="h-4 w-4" />
                  Book Site Visit
                </Link>
              </Button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
