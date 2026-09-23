"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowUpDown, Copy, ExternalLink, FolderKanban, PencilLine, Plus, Search, Star, StarOff, Trash2,
} from "lucide-react";
import { Badge, EmptyState, Switch } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import ConfirmDialog from "./confirm-dialog";
import { cn, formatDate } from "@/lib/utils";
import type { ApiResponse, Project } from "@/lib/types";

type SortKey = "order" | "title" | "updatedAt";

export default function ProjectsTable({ initial }: { initial: Project[] }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.includes(q) ||
        p.techStack.some((t) => t.toLowerCase().includes(q))
      );
    });
    return [...list].sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "updatedAt")
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return a.order - b.order;
    });
  }, [items, query, statusFilter, sortKey]);

  const toggleSort = () =>
    setSortKey((k) => (k === "order" ? "title" : k === "title" ? "updatedAt" : "order"));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(filtered.map((p) => p.id)));

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      const ids = Array.from(toDelete);
      for (const id of ids) {
        const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
        const json = (await res.json()) as ApiResponse<unknown>;
        if (!res.ok || !json.success) throw new Error(json.success ? "Delete failed" : json.error.message);
      }
      setItems((prev) => prev.filter((p) => !toDelete.has(p.id)));
      setSelected(new Set());
      toast.success(ids.length > 1 ? `${ids.length} projects deleted.` : "Project deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
      setToDelete(null);
    }
  };

  const toggleStatus = async (p: Project) => {
    const next = p.status === "published" ? "draft" : "published";
    setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error.message);
      toast.success(`“${p.title}” ${next === "published" ? "published" : "unpublished"}.`);
    } catch (err) {
      setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: p.status } : x)));
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const duplicate = async (p: Project) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${p.title} (Copy)`,
          slug: `${p.slug}-copy-${Date.now().toString(36)}`,
          shortDescription: p.shortDescription,
          description: p.description,
          techStack: p.techStack,
          liveUrl: p.liveUrl,
          secondaryLiveUrl: p.secondaryLiveUrl ?? "",
          githubUrl: p.githubUrl,
          featureImage: p.featureImage,
          gallery: p.gallery,
          keyFeatures: p.keyFeatures,
          challenges: p.challenges,
          role: p.role,
          timeline: p.timeline,
          featured: false,
          status: "draft",
          order: p.order + 1,
        }),
      });
      const json = (await res.json()) as ApiResponse<Project>;
      if (!res.ok || !json.success) throw new Error(json.success ? "Duplicate failed" : json.error.message);
      setItems((prev) => [...prev, json.data]);
      toast.success("Draft copy created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Duplicate failed.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex h-10 w-full max-w-xs items-center gap-2.5 rounded-control border border-adm-border bg-adm-surface px-3.5">
          <Search size={15} className="text-adm-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
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
                statusFilter === s
                  ? "bg-accent text-accent-ink"
                  : "text-adm-muted hover:text-adm-text",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={toggleSort}
          className="inline-flex h-10 items-center gap-1.5 rounded-control border border-adm-border bg-adm-surface px-3 text-xs font-semibold text-adm-muted transition-colors hover:text-adm-text"
          aria-label="Change sort"
        >
          <ArrowUpDown size={13} /> {sortKey === "order" ? "Manual order" : sortKey === "title" ? "Title A–Z" : "Recently updated"}
        </button>
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
            href="/admin/projects/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-control bg-accent px-4 text-sm font-semibold text-accent-ink shadow-sm transition-all hover:bg-accent-hover"
          >
            <Plus size={15} /> New project
          </Link>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          adm
          icon={<FolderKanban size={22} />}
          title={items.length === 0 ? "No projects yet" : "No matches"}
          description={items.length === 0 ? "Add your first project to showcase it on the public site." : "Try a different search or filter."}
          action={
            items.length === 0 && (
              <Link
                href="/admin/projects/new"
                className="inline-flex h-9 items-center gap-1.5 rounded-control bg-accent px-4 text-xs font-semibold text-accent-ink"
              >
                <Plus size={14} /> New project
              </Link>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-adm-border bg-adm-surface shadow-card">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-adm-border text-xs text-adm-faint">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 accent-[--accent]"
                  />
                </th>
                <th className="px-3 py-3 font-medium">Project</th>
                <th className="px-3 py-3 font-medium">Stack</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Featured</th>
                <th className="px-3 py-3 font-medium">Updated</th>
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
                        <img src={p.featureImage} alt="" className="h-full w-full object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-adm-text">{p.title}</p>
                        <p className="truncate text-xs text-adm-faint">/projects/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[180px] px-3 py-3">
                    <p className="truncate text-xs text-adm-muted">{p.techStack.join(", ")}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={p.status === "published"}
                        onChange={() => toggleStatus(p)}
                        label={`Toggle ${p.title} status`}
                      />
                      <Badge tone={p.status === "published" ? "green" : "adm"}>
                        {p.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-adm-muted">
                    {p.featured ? <Star size={15} className="fill-amber-400 text-amber-400" /> : <StarOff size={15} className="text-adm-faint" />}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-adm-muted">
                    {formatDate(p.updatedAt, { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {p.status === "published" && (
                        <a
                          href={`/projects/${p.slug}`}
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
                        href={`/admin/projects/${p.id}/edit`}
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
        title={toDelete && toDelete.size > 1 ? `Delete ${toDelete.size} projects?` : "Delete project?"}
        description="This permanently removes the project(s) and unlinks them from the public site. Media files are kept in the library."
        onConfirm={doDelete}
        onCancel={() => setToDelete(null)}
        loading={busy}
      />
    </div>
  );
}
