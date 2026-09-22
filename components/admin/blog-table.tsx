"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Newspaper, PencilLine, Plus, Search, Trash2 } from "lucide-react";
import { Badge, EmptyState, Switch } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import ConfirmDialog from "./confirm-dialog";
import { cn, formatDate, readingTime } from "@/lib/utils";
import type { ApiResponse, BlogPost } from "@/lib/types";

export default function BlogTable({ initial }: { initial: BlogPost[] }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);

  const isVisible = (p: BlogPost) =>
    p.status === "published" && new Date(p.publishedAt).getTime() <= Date.now();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.slug.includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    });
  }, [items, query, statusFilter]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const ids = Array.from(toDelete);
      for (const id of ids) {
        const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
        const json = (await res.json()) as ApiResponse<unknown>;
        if (!res.ok || !json.success) throw new Error(json.success ? "Delete failed" : json.error.message);
      }
      setItems((prev) => prev.filter((p) => !toDelete.has(p.id)));
      setSelected(new Set());
      toast.success(ids.length > 1 ? `${ids.length} posts deleted.` : "Post deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  const toggleStatus = async (p: BlogPost) => {
    const next = p.status === "published" ? "draft" : "published";
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    try {
      const res = await fetch(`/api/blog/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error.message);
      toast.success(`“${p.title}” ${next === "published" ? "published" : "moved to drafts"}.`);
    } catch (err) {
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: p.status } : x)));
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const duplicate = async (p: BlogPost) => {
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${p.title} (Copy)`,
          slug: `${p.slug}-copy-${Date.now().toString(36)}`,
          excerpt: p.excerpt,
          coverImage: p.coverImage,
          tags: p.tags,
          author: p.author,
          status: "draft",
          publishedAt: p.publishedAt,
          content: p.content,
          metaTitle: p.metaTitle,
          metaDescription: p.metaDescription,
          ogImage: p.ogImage,
          canonicalUrl: p.canonicalUrl,
        }),
      });
      const json = (await res.json()) as ApiResponse<BlogPost>;
      if (!res.ok || !json.success) throw new Error(json.success ? "Duplicate failed" : json.error.message);
      setItems((prev) => [json.data, ...prev]);
      toast.success("Draft copy created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Duplicate failed.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-10 w-full max-w-xs items-center gap-2.5 rounded-control border border-adm-border bg-adm-surface px-3.5">
          <Search size={15} className="text-adm-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            aria-label="Search posts"
            className="w-full bg-transparent text-sm text-adm-text outline-none placeholder:text-adm-faint"
          />
        </label>
        <div className="flex rounded-control border border-adm-border bg-adm-surface p-0.5" role="group" aria-label="Status filter">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              aria-pressed={statusFilter === s}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                statusFilter === s ? "bg-accent text-accent-ink" : "text-adm-muted hover:text-adm-text",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={() => setToDelete(new Set(selected))}
              className="inline-flex h-10 items-center gap-1.5 rounded-control bg-red-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-red-500"
            >
              <Trash2 size={13} /> Delete ({selected.size})
            </button>
          )}
          <Link
            href="/admin/blog/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-control bg-accent px-4 text-sm font-semibold text-accent-ink shadow-sm transition-all hover:bg-accent-hover"
          >
            <Plus size={15} /> New post
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          adm
          icon={<Newspaper size={22} />}
          title={items.length === 0 ? "No posts yet" : "No matches"}
          description={items.length === 0 ? "Publish your first article to build authority and SEO reach." : "Try a different search or filter."}
          action={
            items.length === 0 && (
              <Link
                href="/admin/blog/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-control bg-accent px-4 text-xs font-semibold text-accent-ink"
              >
                <Plus size={14} /> New post
              </Link>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-adm-border bg-adm-surface shadow-card">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-adm-border text-xs text-adm-faint">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={() => setSelected(allChecked ? new Set() : new Set(filtered.map((p) => p.id)))}
                    aria-label="Select all rows"
                    className="h-4 w-4 accent-[--accent]"
                  />
                </th>
                <th className="px-3 py-3 font-medium">Post</th>
                <th className="px-3 py-3 font-medium">Tags</th>
                <th className="px-3 py-3 font-medium">Publish date</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-adm-border">
              {filtered.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-adm-surface-2">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={`Select ${p.title}`}
                      className="h-4 w-4 accent-[--accent]"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-16 shrink-0 overflow-hidden rounded-md border border-adm-border bg-adm-surface-2">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin thumb */}
                        <img src={p.coverImage} alt="" className="h-full w-full object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[300px] truncate font-semibold text-adm-text">{p.title}</p>
                        <p className="truncate text-xs text-adm-faint">
                          /blog/{p.slug} · {readingTime(p.content)} min read
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[160px] px-3 py-3">
                    <p className="truncate text-xs text-adm-muted">{p.tags.join(", ") || "—"}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-adm-muted">
                    {formatDate(p.publishedAt, { month: "short", day: "numeric", year: "numeric" })}
                    {p.status === "published" && new Date(p.publishedAt).getTime() > Date.now() && (
                      <Badge tone="amber" className="ml-2">scheduled</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.status === "published"}
                        onChange={() => toggleStatus(p)}
                        label={`Toggle ${p.title} status`}
                      />
                      <Badge tone={isVisible(p) ? "green" : "adm"}>
                        {p.status === "published" ? (isVisible(p) ? "live" : "scheduled") : "draft"}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {isVisible(p) && (
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View ${p.title} publicly`}
                          className="rounded-lg p-2 text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-accent"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => duplicate(p)}
                        aria-label={`Duplicate ${p.title}`}
                        className="rounded-lg p-2 text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-adm-text"
                      >
                        <Copy size={14} />
                      </button>
                      <Link
                        href={`/admin/blog/${p.id}/edit`}
                        aria-label={`Edit ${p.title}`}
                        className="rounded-lg p-2 text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-accent"
                      >
                        <PencilLine size={14} />
                      </Link>
                      <button
                        onClick={() => setToDelete(new Set([p.id]))}
                        aria-label={`Delete ${p.title}`}
                        className="rounded-lg p-2 text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete && toDelete.size > 1 ? `Delete ${toDelete.size} posts?` : "Delete post?"}
        description="This permanently removes the post(s) from the site. Media files are kept in the library."
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
        loading={busy}
      />
    </div>
  );
}
