import { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// One button system, used site-wide (public + admin).
// Variants: primary | secondary | ghost | danger | adm (admin surface)
// Sizes:    sm | md | lg
// ---------------------------------------------------------------------------

type Variant = "primary" | "secondary" | "ghost" | "danger" | "adm";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink shadow-sm hover:bg-accent-hover hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "border border-border bg-surface text-ink hover:border-border-strong hover:-translate-y-0.5 active:translate-y-0",
  ghost: "text-muted hover:bg-surface-2 hover:text-ink",
  danger:
    "bg-red-600 text-white hover:bg-red-500 hover:-translate-y-0.5 active:translate-y-0",
  adm: "border border-adm-border bg-adm-surface text-adm-text hover:border-adm-border-strong hover:-translate-y-0.5 active:translate-y-0",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4.5 text-sm gap-2 rounded-control",
  lg: "h-12 px-6 text-[0.95rem] gap-2 rounded-control",
};

const base =
  "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none " +
  "transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-55 " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
}) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} {...props}>
      {children}
    </a>
  );
}
