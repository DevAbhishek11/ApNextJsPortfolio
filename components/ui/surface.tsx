import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Surface primitives: Card, Badge, Tag, StatChip, EmptyState, Skeleton.
// ---------------------------------------------------------------------------

export function Card({
  className,
  hover = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface shadow-card",
        hover &&
          "transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-card-hover hover:border-border-strong",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

const badgeTones = {
  neutral: "bg-surface-2 text-muted border-border",
  accent: "bg-accent-soft text-accent border-accent/20",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  red: "bg-red-50 text-red-600 border-red-200",
  adm: "bg-adm-surface-2 text-adm-muted border-adm-border",
} as const;

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.72rem] font-semibold leading-5",
        badgeTones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Tag({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-[0.72rem] font-medium text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-skeleton rounded-lg bg-surface-2", className)}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  adm = false,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  adm?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed px-6 py-16 text-center",
        adm ? "border-adm-border-strong text-adm-muted" : "border-border-strong text-muted",
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 rounded-full p-3",
            adm ? "bg-adm-surface-2 text-adm-faint" : "bg-surface-2 text-faint",
          )}
        >
          {icon}
        </div>
      )}
      <p className={cn("font-semibold", adm ? "text-adm-text" : "text-ink")}>{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-accent" : "bg-adm-border-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
