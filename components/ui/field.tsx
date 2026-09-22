import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Form primitives — one input system for public + admin.
// `area="adm"` switches to admin-theme colors.
// ---------------------------------------------------------------------------

type Area = "public" | "adm";

const inputBase = (area: Area) =>
  cn(
    "w-full rounded-control border px-3.5 text-sm transition-colors duration-150",
    "placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/35 focus:border-accent",
    area === "adm"
      ? "border-adm-border bg-adm-surface-2 text-adm-text placeholder:text-adm-faint"
      : "border-border bg-surface text-ink",
  );

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  area?: Area;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, area = "public", invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase(area),
        "h-10",
        invalid && "border-red-500 focus:ring-red-400/40 focus:border-red-500",
        className,
      )}
      {...props}
    />
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  area?: Area;
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, area = "public", invalid, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase(area),
        "py-2.5 min-h-28 resize-y",
        invalid && "border-red-500 focus:ring-red-400/40 focus:border-red-500",
        className,
      )}
      {...props}
    />
  );
});

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1.5 block text-[0.8rem] font-semibold text-current", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-accent">*</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
      {message}
    </p>
  );
}

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      <FieldError message={error} />
      {!error && hint && <p className="mt-1.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  area?: Area;
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, area = "public", invalid, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase(area),
        "select-chevron h-10 appearance-none pr-9 cursor-pointer",
        invalid && "border-red-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
