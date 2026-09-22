"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-bg px-6 text-center">
      <div className="inline-flex rounded-2xl bg-accent-soft p-4 text-accent">
        <AlertTriangle size={28} />
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 max-w-md text-lg text-muted">
        An unexpected error occurred while loading this page. You can try again — if it keeps
        happening, please let me know via the contact page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
        >
          <RotateCcw size={16} /> Try again
        </button>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 rounded-control border border-border bg-surface px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
        >
          Contact me
        </a>
      </div>
    </main>
  );
}
