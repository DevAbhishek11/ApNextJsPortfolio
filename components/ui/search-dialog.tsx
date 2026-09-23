"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ArrowUpRight, CornerDownLeft, FileText, FolderKanban, Search, Tag, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Global site search — ⌘K / Ctrl+K / "/" anywhere, or the navbar button.
// Data is fetched lazily (public APIs) the first time the dialog opens,
// then filtered entirely client-side. Glass panel with kbd hints.
// ---------------------------------------------------------------------------

interface SearchDoc {
  kind: "project" | "post";
  title: string;
  blurb: string;
  href: string;
  chips: string[];
  haystack: string;
}

interface ProjectApi {
  slug: string; title: string; shortDescription: string; techStack?: string[];
}
interface PostApi {
  slug: string; title: string; excerpt: string; tags?: string[];
}

const RECENTS_KEY = "ap-search-recents";

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

export default function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const openDialog = useCallback(() => {
    setOpen(true);
    setRecents(loadRecents());
  }, []);

  // Global event + keyboard triggers
  useEffect(() => {
    const onCustom = () => openDialog();
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openDialog();
      } else if (!typing && e.key === "/" && !open) {
        e.preventDefault();
        openDialog();
      }
    };
    window.addEventListener("ap:open-search", onCustom);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("ap:open-search", onCustom);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, openDialog]);

  // Lazy data load on first open
  useEffect(() => {
    if (!open || docs !== null) return;
    let cancelled = false;
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/blog").then((r) => r.json()),
    ])
      .then(([p, b]) => {
        if (cancelled) return;
        const projects: SearchDoc[] = (p.success ? (p.data as ProjectApi[]) : []).map((x) => ({
          kind: "project",
          title: x.title,
          blurb: x.shortDescription,
          href: `/projects/${x.slug}`,
          chips: (x.techStack ?? []).slice(0, 3),
          haystack: `${x.title} ${x.shortDescription} ${(x.techStack ?? []).join(" ")}`.toLowerCase(),
        }));
        const posts: SearchDoc[] = (b.success ? (b.data as PostApi[]) : []).map((x) => ({
          kind: "post",
          title: x.title,
          blurb: x.excerpt,
          href: `/blog/${x.slug}`,
          chips: (x.tags ?? []).slice(0, 3),
          haystack: `${x.title} ${x.excerpt} ${(x.tags ?? []).join(" ")}`.toLowerCase(),
        }));
        setDocs([...projects, ...posts]);
        setError(false);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [open, docs]);

  // Focus management + body lock + reset
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      setQuery("");
      setCursor(0);
    };
  }, [open]);

  const results = useMemo(() => {
    if (!docs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return docs.slice(0, 6);
    const terms = q.split(/\s+/);
    return docs
      .map((d) => {
        let score = 0;
        for (const t of terms) {
          if (d.title.toLowerCase().includes(t)) score += 3;
          else if (d.haystack.includes(t)) score += 1;
          else return null;
        }
        return { d, score };
      })
      .filter((x): x is { d: SearchDoc; score: number } => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.d);
  }, [docs, query]);

  const activeCursor = Math.min(cursor, Math.max(results.length - 1, 0));

  const go = useCallback(
    (doc: SearchDoc) => {
      try {
        const next = [doc.title, ...loadRecents().filter((r) => r !== doc.title)].slice(0, 5);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      setOpen(false);
      router.push(doc.href);
    },
    [router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[activeCursor]) {
      go(results[activeCursor]);
    }
  };

  // Keep the keyboard cursor visible inside the scrollable list.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current
      .querySelector(`[data-idx="${activeCursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeCursor]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search the site"
    >
      <div
        className="animate-modal-in absolute inset-0 bg-ink/35 backdrop-blur-md"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="animate-modal-in glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search size={17} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search projects, posts, tech…"
            aria-label="Search query"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={results[activeCursor] ? `sr-${results[activeCursor].href}` : undefined}
            className="w-full bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-faint"
          />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close search"
            className="shrink-0 rounded-full p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2" id="search-results" role="listbox">
          {error && (
            <p className="px-3 py-8 text-center text-sm text-muted">
              Search is unavailable right now — please try again shortly.
            </p>
          )}
          {!error && docs !== null && results.length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium text-ink">No matches for “{query.trim()}”</p>
              <p className="mt-1 text-xs text-faint">Try a technology (Next.js, Socket.IO) or a topic.</p>
            </div>
          )}
          {docs === null && !error && (
            <div className="space-y-2 p-1.5" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-skeleton h-14 rounded-xl bg-surface-2" />
              ))}
            </div>
          )}
          {!error && docs !== null && results.length > 0 && (
            <ul>
              {results.map((doc, i) => (
                <li key={doc.href} data-idx={i} role="option" aria-selected={activeCursor === i} id={`sr-${doc.href}`}>
                  <button
                    onClick={() => go(doc)}
                    onMouseEnter={() => setCursor(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      activeCursor === i ? "bg-accent-soft" : "hover:bg-surface-2",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        doc.kind === "project"
                          ? "border-accent/25 bg-accent-soft text-accent"
                          : "border-border bg-surface-2 text-muted",
                      )}
                    >
                      {doc.kind === "project" ? <FolderKanban size={15} /> : <FileText size={15} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.88rem] font-semibold text-ink">{doc.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-faint">{doc.blurb}</span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 sm:flex">
                      {doc.chips.map((c) => (
                        <span key={c} className="rounded-full border border-border px-2 py-0.5 text-[0.62rem] font-medium text-faint">
                          {c}
                        </span>
                      ))}
                    </span>
                    {activeCursor === i && <CornerDownLeft size={13} className="shrink-0 text-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {/* Recents */}
          {!error && docs !== null && query.trim() === "" && recents.length > 0 && (
            <div className="mt-1 border-t border-border px-3 pb-1 pt-3">
              <p className="mb-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-faint">Recent</p>
              <div className="flex flex-wrap gap-1.5">
                {recents.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setQuery(r); setCursor(0); }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    <Tag size={11} /> {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center justify-between border-t border-border bg-surface-2/60 px-4 py-2.5">
          <div className="flex items-center gap-3 text-[0.68rem] text-faint">
            <span className="inline-flex items-center gap-1"><kbd className="kbd">↑↓</kbd> navigate</span>
            <span className="inline-flex items-center gap-1"><kbd className="kbd">↵</kbd> open</span>
            <span className="inline-flex items-center gap-1"><kbd className="kbd">esc</kbd> close</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[0.68rem] text-faint">
            Jump anywhere <ArrowUpRight size={11} />
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
