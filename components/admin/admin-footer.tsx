import Link from "next/link";
import { Database, Server } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";

// ---------------------------------------------------------------------------
// Fixed dashboard footer — sits outside the scrollable main region.
// ---------------------------------------------------------------------------

export default function AdminFooter({ userName }: { userName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="admin-shell flex h-11 shrink-0 items-center justify-between gap-3 border-t border-adm-border bg-adm-surface px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 text-[0.7rem] text-adm-faint">
        <span className="truncate">
          © {year} {userName}
        </span>
        <span className="hidden select-none sm:inline" aria-hidden>
          ·
        </span>
        <span className="hidden items-center gap-1.5 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
          System healthy
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-adm-border bg-adm-bg px-2.5 py-1 text-[0.62rem] font-medium tracking-wide text-adm-faint md:inline-flex">
          <Database size={11} aria-hidden /> Local JSON store
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-adm-border bg-adm-bg px-2.5 py-1 text-[0.62rem] font-medium tracking-wide text-adm-faint md:inline-flex">
          <Server size={11} aria-hidden /> Node runtime
        </span>
        <a
          href="https://github.com/DevAbhishek11/ApNextJsPortfolio"
          target="_blank"
          rel="noreferrer"
          aria-label="Open repository on GitHub"
          className="inline-flex h-7 w-7 items-center justify-center rounded-control text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-adm-text"
        >
          <GithubIcon size={14} />
        </a>
        <Link
          href="/"
          target="_blank"
          className="inline-flex h-7 items-center rounded-control bg-adm-surface-2 px-2.5 text-[0.68rem] font-semibold text-adm-muted transition-colors hover:bg-adm-border hover:text-adm-text"
        >
          View site ↗
        </Link>
      </div>
    </footer>
  );
}
