import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Mail,
  Phone,
  Send,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { projectsQueryOptions } from "@/hooks/queries/options";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/hrc";

type Values = {
  name: string;
  email: string;
  mobile: string;
  project: string;
  projectId: string;
};

type Errors = Partial<Record<keyof Values, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const indianMobileRegex = /^(?:\+?91[\s-]?)?[6-9]\d{9}$/;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Please enter your name.";
  if (!v.email.trim()) e.email = "Please enter your email address.";
  else if (!emailRegex.test(v.email.trim())) e.email = "Enter a valid email address.";
  const mobile = v.mobile.replace(/[\s-]/g, "").trim();
  if (!mobile) e.mobile = "Please enter your mobile number.";
  else if (!indianMobileRegex.test(mobile))
    e.mobile = "Enter a valid 10-digit Indian mobile number.";
  if (!v.project.trim()) e.project = "Please select a project.";
  return e;
}

function utmFromUrl(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ]) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

export function HeroEnquiryCard({ project }: { project: Project }) {
  const { data: projects } = useQuery({
    ...projectsQueryOptions({ per_page: 100 }),
    staleTime: 5 * 60_000,
  });

  const [values, setValues] = React.useState<Values>({
    name: "",
    email: "",
    mobile: "",
    project: project.title,
    projectId: String(project.id ?? ""),
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // Keep the current project auto-selected when navigating between projects.
  React.useEffect(() => {
    setValues((prev) => ({
      ...prev,
      project: project.title,
      projectId: String(project.id ?? ""),
    }));
  }, [project.id, project.title]);

  const update = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (status !== "idle") setStatus("idle");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setStatus("idle");

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      mobile: values.mobile.replace(/[\s-]/g, "").trim(),
      project: values.project.trim(),
      project_id: values.projectId,
      source: "Website Project Enquiry",
      lead_source: "Website Project Enquiry",
      status: "New",
      lead_status: "New",
      page_url: typeof window !== "undefined" ? window.location.href : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
      submitted_at: new Date().toISOString(),
      ...utmFromUrl(),
    };

    try {
      const res = await fetch("/api/public/enquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      let json: { success?: boolean } | null = null;
      try {
        json = await res.json();
      } catch {
        /* ignore */
      }
      if (res.ok && json?.success) {
        setStatus("success");
        setValues({
          name: "",
          email: "",
          mobile: "",
          project: project.title,
          projectId: String(project.id ?? ""),
        });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const options = React.useMemo(() => {
    const list = (projects ?? []) as Project[];
    const seen = new Set<string>();
    const out: { id: string; title: string }[] = [];
    for (const p of [project, ...list]) {
      const title = String(p?.title ?? "").trim();
      if (!title || seen.has(title)) continue;
      seen.add(title);
      out.push({ id: String(p.id ?? ""), title });
    }
    return out;
  }, [projects, project]);

  return (
    <div className="w-full max-w-full rounded-[var(--radius)] border border-white/25 bg-white/95 p-5 text-left shadow-[0_24px_70px_rgba(10,31,68,0.35)] backdrop-blur-md text-[color:var(--navy)] sm:p-6 lg:max-w-[420px]">
      <h2 className="font-serif text-[22px] font-semibold leading-tight text-[color:var(--navy)]">
        Interested in this project?
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[color:var(--text-secondary,#3a4560)]">
        Share your details and our property advisor will contact you shortly.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-3.5">
        <FormField id="hero-name" label="Name" error={errors.name} icon={<User className="h-3.5 w-3.5" />}>
          <Input
            id="hero-name"
            autoComplete="name"
            placeholder="Your full name"
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!errors.name}
          />
        </FormField>

        <FormField id="hero-email" label="Email Address" error={errors.email} icon={<Mail className="h-3.5 w-3.5" />}>
          <Input
            id="hero-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={!!errors.email}
          />
        </FormField>

        <FormField id="hero-mobile" label="Mobile Number" error={errors.mobile} icon={<Phone className="h-3.5 w-3.5" />}>
          <Input
            id="hero-mobile"
            type="tel"
            autoComplete="tel"
            placeholder="+91 90000 00000"
            value={values.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            aria-invalid={!!errors.mobile}
          />
        </FormField>

        <FormField
          id="hero-project"
          label="Project Name"
          error={errors.project}
          icon={<Building2 className="h-3.5 w-3.5" />}
        >
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                id="hero-project"
                type="button"
                role="combobox"
                aria-expanded={pickerOpen}
                aria-invalid={!!errors.project}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm text-[color:var(--navy)]",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--gold)] focus-visible:ring-offset-2",
                  !values.project && "text-muted-foreground",
                )}
              >
                <span className="truncate">
                  {values.project || "Select a project"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[var(--radix-popover-trigger-width)] p-0"
            >
              <Command>
                <CommandInput placeholder="Search projects…" />
                <CommandList>
                  <CommandEmpty>No project found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option) => (
                      <CommandItem
                        key={`${option.id}-${option.title}`}
                        value={option.title}
                        onSelect={() => {
                          setValues((prev) => ({
                            ...prev,
                            project: option.title,
                            projectId: option.id,
                          }));
                          setErrors((prev) => ({ ...prev, project: undefined }));
                          setPickerOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            values.project === option.title
                              ? "opacity-100 text-[color:var(--gold)]"
                              : "opacity-0",
                          )}
                        />
                        <span className="truncate">{option.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </FormField>

        {status === "success" ? (
          <p
            role="status"
            className="rounded-md border border-[color:var(--gold)]/40 bg-[color:var(--ivory)] px-3 py-2.5 text-[13px] font-medium leading-relaxed text-[color:var(--navy)]"
          >
            Thank you! Your enquiry has been submitted successfully. Our property
            advisor will contact you shortly.
          </p>
        ) : null}
        {status === "error" ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-[13px] font-medium leading-relaxed text-destructive"
          >
            We couldn&rsquo;t submit your enquiry right now. Please try again.
          </p>
        ) : null}

        <Button
          type="submit"
          variant="gold"
          size="lg"
          disabled={submitting}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Request a Callback
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function FormField({
  id,
  label,
  error,
  icon,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--label,#334155)]"
      >
        {icon ? (
          <span className="text-[color:var(--gold)]" aria-hidden>
            {icon}
          </span>
        ) : null}
        {label}
        <span className="text-[color:var(--gold)]">*</span>
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default HeroEnquiryCard;
