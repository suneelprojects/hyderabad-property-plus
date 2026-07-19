import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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

export interface EnquiryModalProps {
  /** Controlled open state. Omit to use the built-in trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional trigger element when using uncontrolled mode. */
  trigger?: ReactNode;
  /** Pre-fill the "Interested Project" field. */
  defaultProject?: string;
  /** Optional heading override. */
  title?: string;
  /** Optional subtitle override. */
  subtitle?: string;
  /** Called after a successful client-side submission. */
  onSubmit?: (values: EnquiryFormValues) => void;
}

export function EnquiryModal({
  open,
  onOpenChange,
  trigger,
  defaultProject = "",
  title = "Talk to Our Property Expert",
  subtitle = "Our property advisors will help you find the right home.",
  onSubmit,
}: EnquiryModalProps) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [values, setValues] = useState<EnquiryFormValues>({
    ...initialValues,
    project: defaultProject,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    // eslint-disable-next-line no-console
    console.log("[EnquiryModal] submit", values);
    onSubmit?.(values);
    setSubmitting(false);
    setValues({ ...initialValues, project: defaultProject });
    setOpen(false);
  };

  const handleCancel = () => {
    setErrors({});
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className={cn(
          "max-w-[560px] gap-0 overflow-hidden border-0 p-0",
          "shadow-[0_20px_50px_rgba(10,31,68,0.18)]",
        )}
      >
        <div className="relative bg-[var(--navy)] px-6 py-6 text-white sm:px-8 sm:py-7">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(circle at 20% 0%, rgba(201,169,97,0.35), transparent 55%), radial-gradient(circle at 100% 100%, rgba(201,169,97,0.2), transparent 60%)",
            }}
          />
          <DialogHeader className="relative space-y-2 text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Private Consultation
            </span>
            <DialogTitle
              className="font-[var(--font-head)] text-2xl font-semibold leading-tight text-white sm:text-[28px]"
            >
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/75">
              {subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="max-h-[70vh] overflow-y-auto bg-white px-6 py-6 sm:px-8"
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

          <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="sm:min-w-[120px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-2)] hover:text-[var(--navy)] sm:min-w-[180px]"
            >
              Submit Enquiry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  children: ReactNode;
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
