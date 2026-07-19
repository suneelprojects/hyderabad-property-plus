import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Building2, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types

export type EnquiryFormValues = {
  fullName: string;
  mobile: string;
  email: string;
  project: string;
  visitDate: string;
  message: string;
};

const initialValues: EnquiryFormValues = {
  fullName: "",
  mobile: "",
  email: "",
  project: "",
  visitDate: "",
  message: "",
};

type Errors = Partial<Record<keyof EnquiryFormValues, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^[+\d][\d\s-]{7,}$/;

function validate(values: EnquiryFormValues): Errors {
  const errors: Errors = {};
  if (!values.fullName.trim()) errors.fullName = "Please enter your full name.";
  if (!values.mobile.trim()) {
    errors.mobile = "Please enter your mobile number.";
  } else if (!mobileRegex.test(values.mobile.trim())) {
    errors.mobile = "Enter a valid mobile number.";
  }
  if (values.email.trim() && !emailRegex.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Global provider + hook

type OpenOptions = { project?: string };

type EnquiryContextValue = {
  open: (options?: OpenOptions) => void;
  close: () => void;
  isOpen: boolean;
};

const EnquiryContext = React.createContext<EnquiryContextValue | null>(null);

export function useEnquiry(): EnquiryContextValue {
  const ctx = React.useContext(EnquiryContext);
  if (!ctx) {
    throw new Error("useEnquiry must be used inside <EnquiryProvider>.");
  }
  return ctx;
}

export function EnquiryProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [project, setProject] = React.useState<string>("");

  const open = React.useCallback((options?: OpenOptions) => {
    setProject(options?.project ?? "");
    setIsOpen(true);
  }, []);

  const close = React.useCallback(() => setIsOpen(false), []);

  const value = React.useMemo(
    () => ({ open, close, isOpen }),
    [open, close, isOpen],
  );

  return (
    <EnquiryContext.Provider value={value}>
      {children}
      <EnquiryModal
        open={isOpen}
        onOpenChange={setIsOpen}
        defaultProject={project}
      />
    </EnquiryContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Modal component

export interface EnquiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProject?: string;
  title?: string;
  subtitle?: string;
  onSubmit?: (values: EnquiryFormValues) => void;
}

export function EnquiryModal({
  open,
  onOpenChange,
  defaultProject = "",
  title = "Book a Free Site Visit",
  subtitle = "Share a few details and our senior advisor will call within one business hour.",
  onSubmit,
}: EnquiryModalProps) {
  const [values, setValues] = React.useState<EnquiryFormValues>({
    ...initialValues,
    project: defaultProject,
  });
  const [errors, setErrors] = React.useState<Errors>({});

  // Reset form + prefill project whenever the modal opens.
  React.useEffect(() => {
    if (open) {
      setValues({ ...initialValues, project: defaultProject });
      setErrors({});
    }
  }, [open, defaultProject]);

  const update = <K extends keyof EnquiryFormValues>(
    key: K,
    value: EnquiryFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // eslint-disable-next-line no-console
    console.log("[EnquiryModal] submit", values);
    onSubmit?.(values);
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop — dark semi-transparent + slight blur of page behind */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[rgba(10,31,68,0.55)] backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[560px]",
            "-translate-x-1/2 -translate-y-1/2",
            "max-h-[calc(100dvh-2rem)] overflow-hidden",
            "rounded-[var(--radius)] bg-white shadow-[0_25px_80px_rgba(10,31,68,0.35)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-[var(--navy)] px-6 pb-6 pt-7 text-white sm:px-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 15% 0%, rgba(201,169,97,0.4), transparent 55%), radial-gradient(circle at 100% 100%, rgba(201,169,97,0.22), transparent 60%)",
              }}
            />

            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/90 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy)]"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>

            <div className="relative flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--gold)] text-[var(--navy)]">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <div className="font-serif text-[15px] font-semibold text-white">
                  Hyderabad Realty Choices
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                  Luxury Homes · Trusted Choices
                </div>
              </div>
            </div>

            <div className="relative mt-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Private Consultation
              </span>
              <DialogPrimitive.Title className="mt-2 font-serif text-[26px] font-semibold leading-tight text-white sm:text-[30px]">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 max-w-[46ch] text-sm text-white/75">
                {subtitle}
              </DialogPrimitive.Description>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="max-h-[calc(100dvh-16rem)] overflow-y-auto bg-white px-6 py-6 sm:px-8"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="enquiry-name"
                label="Full Name"
                required
                error={errors.fullName}
                className="sm:col-span-2"
              >
                <Input
                  id="enquiry-name"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={values.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  aria-invalid={!!errors.fullName}
                  autoFocus
                />
              </Field>

              <Field
                id="enquiry-mobile"
                label="Mobile Number"
                required
                error={errors.mobile}
              >
                <Input
                  id="enquiry-mobile"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 90000 00000"
                  value={values.mobile}
                  onChange={(e) => update("mobile", e.target.value)}
                  aria-invalid={!!errors.mobile}
                />
              </Field>

              <Field id="enquiry-email" label="Email Address" error={errors.email}>
                <Input
                  id="enquiry-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={!!errors.email}
                />
              </Field>

              <Field id="enquiry-project" label="Interested Project">
                <Input
                  id="enquiry-project"
                  placeholder="e.g. Alekhya Rise"
                  value={values.project}
                  onChange={(e) => update("project", e.target.value)}
                />
              </Field>

              <Field id="enquiry-date" label="Preferred Visit Date">
                <Input
                  id="enquiry-date"
                  type="date"
                  value={values.visitDate}
                  onChange={(e) => update("visitDate", e.target.value)}
                />
              </Field>

              <Field
                id="enquiry-message"
                label="Message"
                className="sm:col-span-2"
              >
                <Textarea
                  id="enquiry-message"
                  rows={4}
                  placeholder="Tell us what you're looking for…"
                  value={values.message}
                  onChange={(e) => update("message", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="sm:min-w-[120px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-2)] hover:text-[var(--navy)] sm:min-w-[180px]"
              >
                Submit Enquiry
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Field({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={id}
        className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--navy)]"
      >
        {label}
        {required ? <span className="ml-0.5 text-[var(--gold)]">*</span> : null}
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

export default EnquiryModal;
