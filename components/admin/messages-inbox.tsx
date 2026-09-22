"use client";

import { useMemo, useState } from "react";
import { Inbox, Mail, MailOpen, Reply, Search, Trash2 } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import ConfirmDialog from "./confirm-dialog";
import { cn, formatDate, relativeTime, truncate } from "@/lib/utils";
import type { ApiResponse, Message } from "@/lib/types";

export default function MessagesInbox({ initial }: { initial: Message[] }) {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);
  const [toDelete, setToDelete] = useState<Message | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (filter === "unread" && m.read) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [items, query, filter]);

  const active = items.find((m) => m.id === activeId) ?? null;

  const setRead = async (m: Message, read: boolean) => {
    setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, read } : x)));
    try {
      const res = await fetch(`/api/messages/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!json.success) throw new Error(json.error.message);
    } catch (err) {
      setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: !read } : x)));
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const openMessage = (m: Message) => {
    setActiveId(m.id);
    if (!m.read) void setRead(m, true);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await fetch(`/api/messages/${toDelete.id}`, { method: "DELETE" });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !json.success) throw new Error(json.success ? "Delete failed" : json.error.message);
      setItems((prev) => prev.filter((x) => x.id !== toDelete.id));
      if (activeId === toDelete.id) setActiveId(null);
      toast.success("Message deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(300px,420px)_1fr]">
      {/* List column */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 flex-1 items-center gap-2.5 rounded-control border border-adm-border bg-adm-surface px-3.5">
            <Search size={15} className="text-adm-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages…"
              aria-label="Search messages"
              className="w-full bg-transparent text-sm text-adm-text outline-none placeholder:text-adm-faint"
            />
          </label>
          <div className="flex rounded-control border border-adm-border bg-adm-surface p-0.5" role="group" aria-label="Filter">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  filter === f ? "bg-accent text-accent-ink" : "text-adm-muted hover:text-adm-text",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            adm
            icon={<Inbox size={22} />}
            title={items.length === 0 ? "Inbox zero" : "No matches"}
            description={
              items.length === 0
                ? "Contact form submissions will land here."
                : "Try clearing the search or filter."
            }
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => openMessage(m)}
                  aria-current={activeId === m.id}
                  className={cn(
                    "w-full rounded-card border p-4 text-left transition-colors",
                    activeId === m.id
                      ? "border-accent bg-adm-accent-soft/60"
                      : "border-adm-border bg-adm-surface hover:bg-adm-surface-2",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-[0.85rem]", m.read ? "font-medium text-adm-muted" : "font-semibold text-adm-text")}>
                      {m.subject}
                    </p>
                    {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                  </div>
                  <p className="mt-1 truncate text-xs text-adm-faint">
                    {m.name} · {m.email}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-adm-muted">
                    {truncate(m.message, 110)}
                  </p>
                  <p className="mt-2 text-[0.65rem] text-adm-faint">{relativeTime(m.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Reading pane */}
      <section className="h-fit rounded-card border border-adm-border bg-adm-surface shadow-card xl:sticky xl:top-24">
        {active ? (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-adm-border p-5">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-adm-text">{active.subject}</h2>
                <p className="mt-1 text-xs text-adm-muted">
                  {active.name} · <a className="text-accent hover:underline" href={`mailto:${active.email}`}>{active.email}</a>
                </p>
                <p className="mt-0.5 text-[0.68rem] text-adm-faint">
                  {formatDate(active.createdAt, {
                    weekday: "short", year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge tone={active.read ? "adm" : "amber"}>{active.read ? "read" : "new"}</Badge>
            </div>
            <div className="p-5">
              <p className="whitespace-pre-wrap text-[0.92rem] leading-relaxed text-adm-text">
                {active.message}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-adm-border p-4">
              <a
                href={`mailto:${active.email}?subject=${encodeURIComponent(`Re: ${active.subject}`)}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-control bg-accent px-4 text-xs font-semibold text-accent-ink transition-colors hover:bg-accent-hover"
              >
                <Reply size={13} /> Reply via email
              </a>
              <button
                onClick={() => void setRead(active, !active.read)}
                className="inline-flex h-9 items-center gap-1.5 rounded-control border border-adm-border px-4 text-xs font-semibold text-adm-text transition-colors hover:border-adm-border-strong"
              >
                {active.read ? <Mail size={13} /> : <MailOpen size={13} />}
                Mark as {active.read ? "unread" : "read"}
              </button>
              <button
                onClick={() => setToDelete(active)}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-control border border-adm-border px-4 text-xs font-semibold text-red-500 transition-colors hover:border-red-400/60"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <MailOpen size={28} className="text-adm-faint" />
            <p className="mt-3 text-sm font-medium text-adm-muted">Select a message to read it</p>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this message?"
        description="The submission will be permanently removed from the inbox."
        onConfirm={() => void doDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
