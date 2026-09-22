"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, LogOut, Menu, Search, User2 } from "lucide-react";
import ThemeToggle from "./theme-toggle";
import { cn } from "@/lib/utils";

const titles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/projects": "Projects",
  "/admin/projects/new": "New Project",
  "/admin/blog": "Blog",
  "/admin/blog/new": "New Post",
  "/admin/media": "Media Library",
  "/admin/builds": "App Builds",
  "/admin/messages": "Messages",
  "/admin/settings": "Settings",
};

function resolveTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/admin/projects/") && pathname.endsWith("/edit")) return "Edit Project";
  if (pathname.startsWith("/admin/blog/") && pathname.endsWith("/edit")) return "Edit Post";
  return "Admin";
}

export default function AdminTopbar({
  userName,
  unreadMessages,
  onMenuOpen,
}: {
  userName: string;
  unreadMessages: number;
  onMenuOpen: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((seg, i, all) => ({
      label: seg === "new" ? "New" : seg === "edit" ? "Edit" : seg.charAt(0).toUpperCase() + seg.slice(1),
      href: "/admin/" + all.slice(0, i + 1).join("/"),
    }));

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="admin-shell z-30 flex h-16 shrink-0 items-center gap-3 border-b border-adm-border bg-adm-bg/80 px-4 backdrop-blur-xl sm:px-5">
      <button
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-adm-border text-adm-muted transition-colors hover:border-adm-border-strong hover:text-adm-text lg:hidden"
      >
        <Menu size={17} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[0.95rem] font-semibold text-adm-text">
          {resolveTitle(pathname)}
        </h1>
        <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-xs text-adm-faint sm:flex">
          <Link href="/admin" className="transition-colors hover:text-adm-text">
            Admin
          </Link>
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              <ChevronRight size={11} />
              {i === crumbs.length - 1 ? (
                <span className="text-adm-muted">{c.label}</span>
              ) : (
                <Link href={c.href} className="transition-colors hover:text-adm-text">
                  {c.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      <label className="hidden h-9 w-56 items-center gap-2 rounded-control border border-adm-border bg-adm-surface-2 px-3 lg:flex">
        <Search size={14} className="text-adm-faint" />
        <input
          placeholder="Search…"
          className="w-full bg-transparent text-xs text-adm-text outline-none placeholder:text-adm-faint"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = (e.target as HTMLInputElement).value.trim();
              if (q) router.push(`/admin/projects?q=${encodeURIComponent(q)}`);
            }
          }}
        />
      </label>

      <ThemeToggle />

      <Link
        href="/admin/messages"
        aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ""}`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-control border border-adm-border text-adm-muted transition-colors hover:border-adm-border-strong hover:text-adm-text"
      >
        <Bell size={16} />
        {unreadMessages > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.58rem] font-bold text-accent-ink">
            {unreadMessages}
          </span>
        )}
      </Link>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Account menu"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[0.72rem] font-bold text-accent-ink transition-transform hover:scale-105"
        >
          {initials}
        </button>
        {menuOpen && (
          <div className="animate-modal-in absolute right-0 top-11 w-52 rounded-card border border-adm-border bg-adm-surface p-1.5 shadow-lg">
            <div className="border-b border-adm-border px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-adm-text">{userName}</p>
              <p className="text-xs text-adm-faint">Administrator</p>
            </div>
            <Link
              href="/admin/settings"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.83rem] font-medium text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-text"
            >
              <User2 size={15} /> Profile & settings
            </Link>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.83rem] font-medium text-red-500 transition-colors hover:bg-adm-surface-2"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
