"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft, FolderKanban, Inbox, Images, LayoutDashboard, Newspaper,
  Package, Settings, ExternalLink, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function subscribeCollapsed(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("ap-admin-sidebar", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("ap-admin-sidebar", listener);
  };
}
const getCollapsed = () => localStorage.getItem("ap-admin-sidebar") === "1";
const getServerCollapsed = () => false;

function NavContent({
  items,
  name,
  initials,
  collapsed,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  name: string;
  initials: string;
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-adm-border px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-[0.72rem] font-bold text-accent-ink">
          {initials}
        </span>
        <div
          className={cn(
            "min-w-0 transition-opacity duration-200",
            collapsed ? "hidden opacity-0" : "opacity-100",
          )}
        >
          <p className="truncate text-[0.85rem] font-semibold text-adm-text">{name}</p>
          <p className="text-[0.68rem] text-adm-faint">Admin Console</p>
        </div>
      </div>

      <nav
        className="admin-scroll flex-1 overflow-y-auto overflow-x-hidden p-3"
        aria-label="Admin"
      >
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 whitespace-nowrap rounded-control px-3 py-2.5 text-[0.85rem] font-medium transition-colors duration-150",
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
                  <span
                    className={cn(
                      "truncate transition-opacity duration-200",
                      collapsed ? "hidden opacity-0" : "opacity-100",
                    )}
                  >
                    {item.label}
                  </span>
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
    </>
  );
}

export default function AdminSidebar({
  unreadMessages,
  name,
  mobileOpen,
  onMobileClose,
}: {
  unreadMessages: number;
  name: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, getServerCollapsed);
  const unread = unreadMessages;

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

  return (
    <>
      {/* Desktop column — fixed width part of the shell; only areas inside it scroll */}
      <aside
        className={cn(
          "hidden h-full shrink-0 flex-col overflow-hidden border-r border-adm-border bg-adm-surface lg:flex",
          "transition-[width]",
          collapsed ? "w-[68px]" : "w-[240px]",
        )}
        style={{ transitionDuration: "280ms", transitionTimingFunction: EASE }}
      >
        <NavContent
          items={items}
          name={name}
          initials={initials}
          collapsed={collapsed}
          pathname={pathname}
        />
        <div className="shrink-0 border-t border-adm-border p-3">
          <Link
            href="/"
            target="_blank"
            className={cn(
              "flex items-center gap-3 whitespace-nowrap rounded-control px-3 py-2.5 text-[0.85rem] font-medium text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-text",
              collapsed && "justify-center px-0",
            )}
            title={collapsed ? "View site" : undefined}
          >
            <ExternalLink size={16} className="shrink-0" />
            <span className={cn("transition-opacity duration-200", collapsed ? "hidden opacity-0" : "opacity-100")}>
              View site
            </span>
          </Link>
          <button
            onClick={() => {
              localStorage.setItem("ap-admin-sidebar", collapsed ? "0" : "1");
              window.dispatchEvent(new Event("ap-admin-sidebar"));
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "mt-1 flex w-full items-center gap-3 whitespace-nowrap rounded-control px-3 py-2.5 text-[0.85rem] font-medium text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-text",
              collapsed && "justify-center px-0",
            )}
          >
            <ChevronsLeft
              size={16}
              className={cn(
                "shrink-0 transition-transform duration-300",
                collapsed && "rotate-180",
              )}
              style={{ transitionTimingFunction: EASE }}
            />
            <span className={cn("transition-opacity duration-200", collapsed ? "hidden opacity-0" : "opacity-100")}>
              Collapse
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer — always mounted so open AND close are animated */}
      <div
        className={cn(
          "fixed inset-0 z-[80] lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={onMobileClose}
        />
        {/* Panel — spring-eased slide */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Admin navigation"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[282px] max-w-[85vw] flex-col border-r border-adm-border bg-adm-surface shadow-2xl",
            "transition-all",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          style={{
            transitionDuration: "340ms",
            transitionTimingFunction: EASE,
            transitionProperty: "transform, opacity",
            transform: mobileOpen ? "translateX(0)" : "translateX(-104%)",
          }}
        >
          <div className="absolute right-3 top-4">
            <button
              onClick={onMobileClose}
              aria-label="Close menu"
              className="flex h-8 w-8 items-center justify-center rounded-control text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-text"
              tabIndex={mobileOpen ? 0 : -1}
            >
              <X size={17} />
            </button>
          </div>
          <NavContent
            items={items}
            name={name}
            initials={initials}
            collapsed={false}
            pathname={pathname}
            onNavigate={onMobileClose}
          />
          <div className="shrink-0 border-t border-adm-border p-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 rounded-control px-3 py-2.5 text-[0.85rem] font-medium text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-text"
              tabIndex={mobileOpen ? 0 : -1}
            >
              <ExternalLink size={16} /> View site
            </Link>
            {/* Drawer hint */}
            <p className="mt-2 px-3 pb-1 text-[0.66rem] leading-relaxed text-adm-faint">
              Tip: the sidebar collapses on desktop for a wider workspace.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
