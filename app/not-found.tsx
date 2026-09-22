import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-24 rounded-full bg-[radial-gradient(closest-side,rgba(79,70,229,0.12),transparent)]"
        />
        <p className="relative font-mono text-sm tracking-[0.3em] text-accent uppercase">
          404 — Lost in space
        </p>
      </div>
      <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
        This page took a wrong turn.
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted">
        The page you&apos;re looking for doesn&apos;t exist or was moved. Let&apos;s get you back to
        familiar territory.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
        >
          <ArrowLeft size={16} /> Back home
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong"
        >
          <Compass size={16} /> Browse projects
        </Link>
      </div>
    </main>
  );
}
