"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Minimal toast system. Wrap parts of the tree in <ToastProvider> and call
// const toast = useToast(); toast.success("Saved");
// ---------------------------------------------------------------------------

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const icons: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 size={17} className="text-emerald-500" />,
  error: <AlertCircle size={17} className="text-red-500" />,
  info: <Info size={17} className="text-accent" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        success: (m) => push("success", m),
        error: (m) => push("error", m),
        info: (m) => push("info", m),
      }}
    >
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-xs flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "toast-card animate-toast-in pointer-events-auto flex items-start gap-2.5 rounded-control border",
              "px-3.5 py-3 text-sm shadow-md",
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.kind]}</span>
            <p className="toast-title flex-1 font-medium">{t.message}</p>
            <button
              aria-label="Dismiss notification"
              className="toast-close transition-colors"
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
