"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check, Copy, Images, Link2, Loader2, Search, Trash2, UploadCloud,
} from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import ConfirmDialog from "./confirm-dialog";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import type { ApiResponse, BlogPost, MediaItem, Project } from "@/lib/types";
import { uploadMedia } from "./media-upload";

interface UploadTask {
  id: number;
  name: string;
  progress: number;
  error?: string;
}

let taskId = 0;

export default function MediaLibrary({ initial }: { initial: MediaItem[] }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [usage, setUsage] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState("");
  const [mimeFilter, setMimeFilter] = useState("all");
  const [dragging, setDragging] = useState(false);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute "used in" references (scan projects + blog for this URL).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pRes, bRes] = await Promise.all([fetch("/api/projects"), fetch("/api/blog")]);
        const [pJson, bJson] = await Promise.all([pRes.json(), bRes.json()]);
        if (cancelled) return;
        const map: Record<string, string[]> = {};
        const register = (url: string | undefined, label: string) => {
          if (!url) return;
          map[url] = [...(map[url] ?? []), label];
        };
        if (pJson.success) {
          (pJson.data as Project[]).forEach((p) => {
            register(p.featureImage, `Project: ${p.title}`);
            p.gallery.forEach((g) => register(g, `Project: ${p.title} (gallery)`));
          });
        }
        if (bJson.success) {
          (bJson.data as BlogPost[]).forEach((b) => {
            register(b.coverImage, `Post: ${b.title}`);
          });
        }
        setUsage(map);
      } catch {
        /* usage map is best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items.length]);

  const doUpload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).slice(0, 10);
      for (const file of list) {
        const id = ++taskId;
        setTasks((t) => [...t, { id, name: file.name, progress: 0 }]);
        try {
          const item = await uploadMedia(file, (pct) =>
            setTasks((t) => t.map((x) => (x.id === id ? { ...x, progress: pct } : x))),
          );
          setItems((prev) => [item, ...prev]);
          setTasks((t) => t.filter((x) => x.id !== id));
          toast.success(`“${file.name}” uploaded.`);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Upload failed";
          setTasks((t) => t.map((x) => (x.id === id ? { ...x, error: message } : x)));
          setTimeout(() => setTasks((t) => t.filter((x) => x.id !== id)), 5000);
        }
      }
    },
    [toast],
  );

  const filtered = items.filter((m) => {
    if (mimeFilter !== "all" && m.mimeType !== mimeFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return m.filename.toLowerCase().includes(q) || m.url.toLowerCase().includes(q);
  });

  const mimeTypes = Array.from(new Set(items.map((m) => m.mimeType)));

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDelete.id }),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !json.success) throw new Error(json.success ? "Delete failed" : json.error.message);
      setItems((prev) => prev.filter((m) => m.id !== toDelete.id));
      toast.success("File deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setToDelete(null);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(new URL(url, window.location.origin).href);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 1500);
    } catch {
      toast.error("Clipboard unavailable.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload images — click or drop files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void doUpload(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging
            ? "border-accent bg-adm-accent-soft"
            : "border-adm-border-strong bg-adm-surface hover:border-adm-faint",
        )}
      >
        <span className="rounded-full bg-adm-accent-soft p-3 text-accent">
          <UploadCloud size={20} />
        </span>
        <p className="text-sm font-semibold text-adm-text">
          Drop images here, or <span className="text-accent">browse</span>
        </p>
        <p className="text-xs text-adm-faint">JPG, PNG, WebP, GIF or SVG · max 12MB each · up to 10 at once</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void doUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* In-flight uploads */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className={cn(
                "rounded-control border px-4 py-3",
                t.error ? "border-red-400/50 bg-red-500/5" : "border-adm-border bg-adm-surface",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs font-semibold text-adm-text">{t.name}</p>
                {t.error ? (
                  <span className="text-xs font-medium text-red-500">{t.error}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-adm-faint">
                    {t.progress < 100 && <Loader2 size={11} className="animate-spin" />}
                    {t.progress}%
                  </span>
                )}
              </div>
              {!t.error && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-adm-surface-2">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-200"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-10 w-full max-w-xs items-center gap-2.5 rounded-control border border-adm-border bg-adm-surface px-3.5">
          <Search size={15} className="text-adm-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search media…"
            aria-label="Search media"
            className="w-full bg-transparent text-sm text-adm-text outline-none placeholder:text-adm-faint"
          />
        </label>
        <div className="flex rounded-control border border-adm-border bg-adm-surface p-0.5" role="group" aria-label="Type filter">
          {["all", ...mimeTypes].map((t) => (
            <button
              key={t}
              onClick={() => setMimeFilter(t)}
              aria-pressed={mimeFilter === t}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                mimeFilter === t ? "bg-accent text-accent-ink" : "text-adm-muted hover:text-adm-text",
              )}
            >
              {t === "all" ? "All" : t.replace("image/", "")}
            </button>
          ))}
        </div>
        <p className="ml-auto text-xs text-adm-faint">{filtered.length} files</p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          adm
          icon={<Images size={22} />}
          title={items.length === 0 ? "Media library is empty" : "No matches"}
          description="Upload your first image with the dropzone above."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5">
          {filtered.map((m) => {
            const usedIn = usage[m.url] ?? [];
            return (
              <div
                key={m.id}
                className="group overflow-hidden rounded-card border border-adm-border bg-adm-surface shadow-card"
              >
                <div className="relative aspect-[4/3] bg-adm-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbs */}
                  <img src={m.url} alt={m.filename} className="h-full w-full object-cover" loading="lazy" />
                  {m.source === "seed" && (
                    <span className="absolute left-2 top-2">
                      <Badge tone="neutral">seed</Badge>
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-semibold text-adm-text" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-adm-faint">
                    {m.mimeType.replace("image/", "").toUpperCase()} · {formatBytes(m.size)} ·{" "}
                    {formatDate(m.createdAt, { month: "short", day: "numeric" })}
                  </p>
                  {usedIn.length > 0 && (
                    <p className="mt-1.5 flex items-start gap-1 text-[0.65rem] leading-snug text-adm-muted">
                      <Link2 size={10} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{usedIn.slice(0, 2).join(" · ")}{usedIn.length > 2 ? ` +${usedIn.length - 2}` : ""}</span>
                    </p>
                  )}
                  <div className="mt-2.5 flex gap-1.5">
                    <button
                      onClick={() => void copyUrl(m.url)}
                      className="flex h-7 flex-1 items-center justify-center gap-1 rounded-lg border border-adm-border text-[0.68rem] font-semibold text-adm-muted transition-colors hover:border-adm-border-strong hover:text-adm-text"
                      aria-label={`Copy URL of ${m.filename}`}
                    >
                      {copiedUrl === m.url ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      Copy URL
                    </button>
                    <button
                      onClick={() => setToDelete(m)}
                      aria-label={`Delete ${m.filename}`}
                      className="flex h-7 w-8 items-center justify-center rounded-lg border border-adm-border text-adm-faint transition-colors hover:border-red-400/60 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this file?"
        description={
          toDelete && (usage[toDelete.url]?.length ?? 0) > 0
            ? `“${toDelete.filename}” is referenced by ${(usage[toDelete.url] ?? []).length} piece(s) of content (${(usage[toDelete.url] ?? []).slice(0, 2).join(", ")}). Deleting it will leave broken images.`
            : `“${toDelete?.filename}” will be permanently removed — this cannot be undone.`
        }
        onConfirm={() => void doDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
