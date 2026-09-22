import Link from "next/link";
import {
  FilePlus2, FolderKanban, Images, Inbox, Newspaper, Package, Plus, ArrowUpRight,
} from "lucide-react";
import StatCard from "@/components/admin/stat-card";
import { relativeTime } from "@/lib/utils";
import {
  blogRepo, buildsRepo, mediaRepo, messagesRepo, projectsRepo,
} from "@/lib/db/repos";

export default async function AdminOverviewPage() {
  const [projects, posts, messages, media, builds] = await Promise.all([
    projectsRepo.all(),
    blogRepo.all(),
    messagesRepo.all(),
    mediaRepo.all(),
    buildsRepo.all(),
  ]);

  const unread = messages.filter((m) => !m.read).length;
  const publishedPosts = posts.filter((p) => p.status === "published").length;

  // Recent activity — latest mutations across entities, newest first.
  const activity = [
    ...projects.map((p) => ({
      at: p.updatedAt,
      label: `Project “${p.title}” ${p.createdAt === p.updatedAt ? "created" : "updated"}`,
      href: `/admin/projects/${p.id}/edit`,
    })),
    ...posts.map((p) => ({
      at: p.updatedAt,
      label: `Post “${p.title}” ${p.createdAt === p.updatedAt ? "created" : "updated"}`,
      href: `/admin/blog/${p.id}/edit`,
    })),
    ...media.slice(0, 4).map((m) => ({
      at: m.createdAt,
      label: `Uploaded “${m.filename}”`,
      href: "/admin/media",
    })),
    ...builds.slice(0, 3).map((b) => ({
      at: b.createdAt,
      label: `Build ${b.version} (${b.platform}) uploaded`,
      href: "/admin/builds",
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-7">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Projects" value={projects.length} hint={`${projects.filter((p) => p.status === "published").length} published`} icon={FolderKanban} />
        <StatCard label="Blog Posts" value={publishedPosts} hint={`${posts.length - publishedPosts} drafts`} icon={Newspaper} tone="blue" />
        <StatCard label="Unread Messages" value={unread} hint={`${messages.length} total received`} icon={Inbox} tone={unread > 0 ? "amber" : "green"} />
        <StatCard label="Media Files" value={media.length} hint={`${builds.length} builds stored`} icon={Images} tone="green" />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 rounded-control bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
        >
          <Plus size={15} /> New Project
        </Link>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-control border border-adm-border bg-adm-surface px-4 py-2.5 text-sm font-semibold text-adm-text transition-all duration-200 hover:-translate-y-0.5 hover:border-adm-border-strong"
        >
          <FilePlus2 size={15} /> New Blog Post
        </Link>
        <Link
          href="/admin/builds"
          className="inline-flex items-center gap-2 rounded-control border border-adm-border bg-adm-surface px-4 py-2.5 text-sm font-semibold text-adm-text transition-all duration-200 hover:-translate-y-0.5 hover:border-adm-border-strong"
        >
          <Package size={15} /> Upload Build
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Recent activity */}
        <section className="rounded-card border border-adm-border bg-adm-surface shadow-card">
          <header className="border-b border-adm-border px-5 py-4">
            <h2 className="text-sm font-semibold text-adm-text">Recent activity</h2>
          </header>
          <ul className="divide-y divide-adm-border">
            {activity.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-adm-faint">No activity yet.</li>
            )}
            {activity.map((item) => (
              <li key={item.label + item.at}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-adm-surface-2"
                >
                  <span className="truncate text-[0.85rem] text-adm-text">{item.label}</span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-adm-faint">
                    {relativeTime(item.at)} <ArrowUpRight size={12} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent messages */}
        <section className="rounded-card border border-adm-border bg-adm-surface shadow-card">
          <header className="flex items-center justify-between border-b border-adm-border px-5 py-4">
            <h2 className="text-sm font-semibold text-adm-text">Recent messages</h2>
            <Link href="/admin/messages" className="text-xs font-semibold text-accent transition-colors hover:text-accent-hover">
              View inbox
            </Link>
          </header>
          <ul className="divide-y divide-adm-border">
            {messages.slice(0, 6).map((m) => (
              <li key={m.id}>
                <Link
                  href="/admin/messages"
                  className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-adm-surface-2"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.read ? "bg-adm-border-strong" : "bg-accent"}`}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className={m.read ? "block truncate text-[0.85rem] text-adm-muted" : "block truncate text-[0.85rem] font-semibold text-adm-text"}>
                      {m.subject}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-adm-faint">
                      {m.name} · {relativeTime(m.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {messages.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-adm-faint">
                No messages yet — they&apos;ll appear here when visitors contact you.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
