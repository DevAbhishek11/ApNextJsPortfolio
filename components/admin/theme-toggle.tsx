"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminTheme = "light" | "dark";

export function getAdminTheme(): AdminTheme {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

/**
 * Admin dark/light toggle — flips data-theme on <html>, persists to
 * localStorage (read pre-paint by the inline script in app/layout.tsx).
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<AdminTheme>("dark");

  useEffect(() => {
    setTheme(getAdminTheme());
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: AdminTheme = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("ap-admin-theme", next);
      } catch {
        /* private mode */
      }
      // Let /admin/settings know the preference without a save click.
      window.dispatchEvent(new CustomEvent("ap-admin-theme", { detail: next }));
      return next;
    });
  }, []);

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-control border border-adm-border text-adm-muted transition-colors hover:border-adm-border-strong hover:text-adm-text",
        className,
      )}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
