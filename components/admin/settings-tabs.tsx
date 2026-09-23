"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { KeyRound, Mail, Palette, Search, User } from "lucide-react";
import { PasswordForm, SettingsForm, type SettingsSection } from "./settings-forms";
import type { Settings } from "@/lib/types";

type TabKey = SettingsSection | "password";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "contact", label: "Contact & Socials", icon: Mail },
  { key: "seo", label: "SEO", icon: Search },
  { key: "theme", label: "Theme", icon: Palette },
  { key: "password", label: "Password", icon: KeyRound },
];

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((t) => t.key === value);
}

/**
 * Wraps SettingsForm + PasswordForm in an accessible tablist that's
 * addressable via ?tab=profile|contact|seo|theme|password — so any section
 * can be bookmarked, shared, or opened directly. Tab switches only update
 * the URL (history.replaceState) and toggle visibility client-side; they
 * never re-fetch from the server, and SettingsForm's fields stay mounted
 * (just hidden) across tabs so unsaved edits aren't lost.
 */
export function SettingsTabs({ initial }: { initial: Settings }) {
  const searchParams = useSearchParams();
  const idBase = useId();

  const [active, setActive] = useState<TabKey>(() => {
    const t = searchParams.get("tab");
    return isTabKey(t) ? t : "profile";
  });

  // Support browser back/forward between tabs.
  useEffect(() => {
    function onPopState() {
      const t = new URLSearchParams(window.location.search).get("tab");
      setActive(isTabKey(t) ? t : "profile");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});

  function goToTab(key: TabKey) {
    setActive(key);
    const params = new URLSearchParams(window.location.search);
    if (key === "profile") params.delete("tab");
    else params.set("tab", key);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = TABS.length - 1;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next === null) return;
    e.preventDefault();
    const nextKey = TABS[next].key;
    goToTab(nextKey);
    tabRefs.current[nextKey]?.focus();
  }

  // SettingsForm always needs a valid section even while the Password tab
  // is active; `hidden` on SettingsForm takes care of hiding it entirely.
  const settingsSection: SettingsSection = active === "password" ? "profile" : active;

  return (
    <div>
      <div
        role="tablist"
        aria-label="Settings sections"
        className="mb-5 flex flex-wrap gap-1 rounded-card border border-adm-border bg-adm-surface p-1 shadow-card"
      >
        {TABS.map(({ key, label, icon: Icon }, index) => {
          const selected = active === key;
          return (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              id={`${idBase}-tab-${key}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${idBase}-panel-${key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => goToTab(key)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={
                "flex items-center gap-1.5 rounded-control px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm " +
                (selected
                  ? "bg-accent text-white shadow-sm"
                  : "text-adm-faint hover:bg-adm-border/40 hover:text-adm-text")
              }
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      <SettingsForm
        initial={initial}
        activeSection={settingsSection}
        idBase={idBase}
        hidden={active === "password"}
      />

      <div
        id={`${idBase}-panel-password`}
        role="tabpanel"
        aria-labelledby={`${idBase}-tab-password`}
        hidden={active !== "password"}
      >
        <PasswordForm />
      </div>
    </div>
  );
}