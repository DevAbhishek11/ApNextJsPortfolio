import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "accent",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  tone?: "accent" | "green" | "amber" | "blue";
}) {
  const tones: Record<string, string> = {
    accent: "bg-adm-accent-soft text-accent",
    green: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    blue: "bg-sky-500/10 text-sky-500",
  };
  return (
    <div className="rounded-card border border-adm-border bg-adm-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[0.8rem] font-medium text-adm-muted">{label}</p>
        <span className={cn("rounded-lg p-2", tones[tone])}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-adm-text">{value}</p>
      {hint && <p className="mt-1 text-xs text-adm-faint">{hint}</p>}
    </div>
  );
}
