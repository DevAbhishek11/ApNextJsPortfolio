"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Accessible modal: focus trap, Esc to close, backdrop click, portal-rendered.
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  adm = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
  adm?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && ref.current) {
        const focusables = ref.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Focus first focusable element on open
    const t = setTimeout(() => {
      ref.current
        ?.querySelector<HTMLElement>(
          'button:not([disabled]), input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])',
        )
        ?.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        className={cn(
          "animate-modal-in relative w-full rounded-card border shadow-lg",
          wide ? "max-w-3xl" : "max-w-md",
          adm
            ? "border-adm-border bg-adm-surface text-adm-text"
            : "border-border bg-surface text-ink",
        )}
      >
        {(title || true) && (
          <div
            className={cn(
              "flex items-center justify-between border-b px-5 py-3.5",
              adm ? "border-adm-border" : "border-border",
            )}
          >
            <h2 className="text-sm font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className={cn(
                "rounded-lg p-1.5 transition-colors",
                adm
                  ? "text-adm-muted hover:bg-adm-surface-2 hover:text-adm-text"
                  : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="max-h-[min(75vh,720px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
