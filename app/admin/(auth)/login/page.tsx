import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import LoginForm from "@/components/admin/login-form";

// Saved admin theme defaults and site metadata must reflect CMS changes.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-shell flex min-h-svh items-center justify-center bg-adm-bg px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(42% 42% at 50% 0%, var(--adm-accent-soft), transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center justify-center rounded-2xl bg-accent p-3 text-accent-ink shadow-md">
            <ShieldCheck size={22} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-adm-text">
            Admin Console
          </h1>
          <p className="mt-1.5 text-sm text-adm-muted">
            Sign in to manage projects, posts, and content.
          </p>
        </div>
        <div className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-md">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-adm-faint">
          Protected area — attempts are rate-limited and logged.
        </p>
      </div>
    </main>
  );
}
