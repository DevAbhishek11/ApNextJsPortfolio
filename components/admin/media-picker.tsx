"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Search, UploadCloud } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import { cn, formatBytes } from "@/lib/utils";
import type { ApiResponse, MediaItem } from "@/lib/types";

async function uploadOne(file: File): Promise<MediaItem> {
  const form = new FormData();
  form.append("files", file);
  const res = await fetch("/api/media", { method: "POST", body: form });
  const json = (await res.json()) as ApiResponse<{ items: MediaItem[]; errors: { name: string; message: string }[] }>;
  if (!res.ok || !json.success) {
    throw new Error(json.success ? "Upload failed" : json.error.message);
  }
  if (json.data.items.length === 0) {
    throw new Error(json.data.errors[0]?.message ?? "Upload failed");
  }
  return json.data.items[0];
}

/** Modal listing the media library with inline upload; resolves a URL on select. */
export default function MediaPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const json = (await res.json()) as ApiResponse<MediaItem[]>;
      if (json.success) setItems(json.data);
    } catch {
      toast.error("Could not load the media library.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const filtered = items.filter((m) =>
    m.filename.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 10);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        const item = await uploadOne(file);
        setItems((prev) => [item, ...prev]);
        setSelected(item.url);
      }
      toast.success(`${list.length} file${list.length > 1 ? "s" : ""} uploaded.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Choose from media library" wide adm>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex h-10 flex-1 items-center gap-2.5 rounded-control border border-adm-border bg-adm-surface-2 px-3.5">
          <Search size={15} className="text-adm-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files…"
            className="w-full bg-transparent text-sm text-adm-text outline-none placeholder:text-adm-faint"
          />
        </label>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-accent-ink transition-all hover:bg-accent-hover disabled:opacity-50"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
          {uploading ? "Uploading…" : "Upload new"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && void handleFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-skeleton rounded-lg bg-adm-surface-2" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          adm
          icon={<ImagePlus size={22} />}
          title={query ? "No matching files" : "Library is empty"}
          description="Upload an image to get started."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item.url)}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-lg border-2 text-left transition-all",
                selected === item.url
                  ? "border-accent shadow-[0_0_0_3px_var(--adm-accent-soft)]"
                  : "border-adm-border hover:border-adm-border-strong",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- library thumbnails */}
              <img
                src={item.url}
                alt={item.filename}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 truncate bg-ink/70 px-2 py-1 text-[0.62rem] text-white">
                {item.filename} · {formatBytes(item.size)}
              </span>
              {selected === item.url && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-accent p-1 text-accent-ink">
                  <Check size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2 border-t border-adm-border pt-4">
        <button
          onClick={onClose}
          className="rounded-control border border-adm-border px-4 py-2 text-sm font-semibold text-adm-text transition-colors hover:border-adm-border-strong"
        >
          Cancel
        </button>
        <button
          disabled={!selected}
          onClick={() => {
            if (selected) onSelect(selected);
            onClose();
            setSelected(null);
          }}
          className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-all hover:bg-accent-hover disabled:opacity-50"
        >
          Use selected
        </button>
      </div>
    </Modal>
  );
}
