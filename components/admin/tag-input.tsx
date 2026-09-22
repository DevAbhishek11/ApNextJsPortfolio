"use client";

import { useState } from "react";
import { X } from "lucide-react";

/** Chips input for tech stacks / blog tags. Enter or comma commits a tag. */
export default function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter…",
  max = 20,
  area = "adm",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  max?: number;
  area?: "adm" | "public";
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const clean = draft.trim().replace(/,+$/, "");
    if (!clean) return setDraft("");
    if (value.includes(clean)) return setDraft("");
    if (value.length >= max) return setDraft("");
    onChange([...value, clean]);
    setDraft("");
  };

  return (
    <div
      className={
        (area === "adm"
          ? "border-adm-border bg-adm-surface-2 "
          : "border-border bg-surface ") +
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-control border px-2.5 py-2 text-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/35"
      }
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className={
            (area === "adm" ? "bg-adm-surface text-adm-text " : "bg-surface-2 text-ink ") +
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
          }
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-adm-faint transition-colors hover:text-red-500"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => {
          if (e.target.value.includes(",")) {
            setDraft(e.target.value.replace(",", ""));
            setTimeout(commit, 0);
          } else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={commit}
        placeholder={value.length === 0 ? placeholder : ""}
        className={
          (area === "adm" ? "text-adm-text placeholder:text-adm-faint " : "text-ink placeholder:text-faint ") +
          "min-w-24 flex-1 bg-transparent py-0.5 text-xs outline-none"
        }
        aria-label="Add tag"
      />
    </div>
  );
}
