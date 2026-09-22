"use client";

import { useMemo, useState } from "react";
import { Search, FolderSearch } from "lucide-react";
import ProjectCard from "./project-card";
import { RevealGroup } from "@/components/animation/reveal";
import { EmptyState } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

export default function ProjectExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("All");

  const tags = useMemo(() => {
    const all = new Set<string>();
    projects.forEach((p) => p.techStack.forEach((t) => all.add(t)));
    return ["All", ...Array.from(all).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesTag = tag === "All" || p.techStack.includes(tag);
      if (!matchesTag) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.techStack.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, query, tag]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label
          className="flex h-11 w-full items-center gap-2.5 rounded-control border border-border bg-surface px-4 lg:max-w-sm"
        >
          <Search size={16} className="shrink-0 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tech, outcomes…"
            aria-label="Search projects"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by technology">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              aria-pressed={tag === t}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                tag === t
                  ? "border-accent bg-accent text-accent-ink shadow-sm"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-ink",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderSearch size={22} />}
          title="No projects match"
          description="Try a different search term or clear the technology filter."
        />
      ) : (
        <RevealGroup key={tag + query} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </RevealGroup>
      )}
    </>
  );
}
