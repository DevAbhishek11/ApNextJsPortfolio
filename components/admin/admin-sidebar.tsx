"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft, FolderKanban, Inbox, Images, LayoutDashboard, Newspaper,
  Package, Settings, ExternalLink, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export default function AdminSidebar({
  unreadMessages,
  name,
}: {
  unreadMessages: number;
  name: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(unreadMessages);

  useEffect(() => setUnread(unreadMessages), [unreadMessages]);

  useEffect(() => {
    const stored = localStorage.getItem("ap-admin-sidebar");
    if (stored === "1") setCollapsed(true);
  }, []);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/admin/blog", label: "Blog", icon: Newspaper },
    { href: "/admin/media", label: "Media", icon: Images },
    { href: "/admin/builds", label: "Builds", icon: Package },
    { href: "/admin/messages", label: "Messages", icon: Inbox, badge: unread },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        "admin-shell sticky top-0 z-40 flex h-svh shrink-0 flex-col border-r border-adm-border bg-adm-surface transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      <div className={cn("flex h-16 items-center gap-2.5 border-b border-adm-border px-4", collapsed && "justify-center px-2")}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-[0.72rem] font-bold text-accent-ink">
          {initials}
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[0.85rem] font-semibold text-adm-text">{name}</p>
            <p className="text-[0.68rem] text-adm-faint">Admin Console</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-[0.85rem] font-medium transition-colors duration-150",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "bg-adm-accent-soft text-accent"
                      : "text-adm-muted hover:bg-adm-surface-2 hover:text-adm-text",
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  <Icon size={17} className="shrink-0" strokeWidth={1.9} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[0.62rem] font-bold text-accent-ink">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-adm-surface" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-adm-border p-3">
        <Link
          href="/"
          target="_blank"
          className={cn(
            "flex items-center gap-3 rounded-control px-3 py-2.5 text-[0.85rem] font-medium text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-text",
            collapsed && "justify-center px-0",
          )}
          title={collapsed ? "View site" : undefined}
        >
          <ExternalLink size={16} className="shrink-0" />
          {!collapsed && "View site"}
        </Link>
        <button
          onClick={() => {
            setCollapsed((c) => {
              const next = !c;
              localStorage.setItem("ap-admin-sidebar", next ? "1" : "0");
              return next;
            });
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "mt-1 flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-[0.85rem] font-medium text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-text",
            collapsed && "justify-center px-0",
          )}
        >
          <ChevronsLeft
            size={16}
            className={cn("shrink-0 transition-transform duration-200", collapsed && "rotate-180")}
          />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
