"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function subscribeTheme(listener: () => void) {
  window.addEventListener("ap-theme", listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener("ap-theme", listener);
    window.removeEventListener("storage", listener);
  };
}
const serverTheme = (): Theme => "light";
const clientMounted = () => true;
const serverMounted = () => false;

/**
 * Public-site theme toggle. Preferences live in localStorage under `ap-theme`
 * and are applied before first paint by the inline boot script in
 * app/layout.tsx — this button only flips + persists.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, serverTheme);
  const mounted = useSyncExternalStore(subscribeTheme, clientMounted, serverMounted);

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    const root = document.documentElement;

    // Briefly enable color transitions so the flip feels liquid, not jarring.
    root.classList.add("theme-anim");
    root.setAttribute("data-theme", next);
    window.setTimeout(() => root.classList.remove("theme-anim"), 420);

    try {
      localStorage.setItem("ap-theme", next);
      let meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "color-scheme";
        document.head.appendChild(meta);
      }
      meta.content = next === "dark" ? "dark" : "light";
    } catch {
      /* private mode etc. — theme still applies for the session */
    }
    window.dispatchEvent(new Event("ap-theme"));
  }, []);

  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (dark ? "Switch to light theme" : "Switch to dark theme") : "Toggle theme"}
      aria-pressed={dark}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-all duration-200",
        "hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent",
        className,
      )}
    >
      <span className="relative block h-[18px] w-[18px]">
        <Sun
          size={18}
          className={cn(
            "absolute inset-0 transition-all duration-300",
            dark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0",
          )}
        />
        <Moon
          size={18}
          className={cn(
            "absolute inset-0 transition-all duration-300",
            dark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
      </span>
    </button>
  );
}
