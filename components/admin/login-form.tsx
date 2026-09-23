"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import type { ApiResponse } from "@/lib/types";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof loginSchema>, undefined, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !json.success) {
        setFormError(json.success ? "Something went wrong." : json.error.message);
        return;
      }
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setFormError("Network error — please try again.");
    }
  };

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && (
        <div
          role="alert"
          className="rounded-control border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
        >
          {formError}
        </div>
      )}
      <Field label="Email" required error={errors.email?.message} htmlFor="login-email">
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          invalid={!!errors.email}
          {...register("email")}
        />
      </Field>
      <Field label="Password" required error={errors.password?.message} htmlFor="login-password">
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••••"
            invalid={!!errors.password}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-faint transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-[--accent]"
          {...register("remember")}
        />
        Remember me for 30 days
      </label>
      <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
        <LogIn size={15} /> {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <details className="group border-t border-adm-border pt-3.5">
        <summary className="cursor-pointer list-none text-center text-xs font-medium text-adm-faint transition-colors hover:text-adm-muted [&::-webkit-details-marker]:hidden">
          Can&apos;t sign in?
        </summary>
        <ul className="mt-3 space-y-1.5 rounded-control bg-adm-surface-2 p-3.5 text-[0.72rem] leading-relaxed text-adm-muted">
          <li>• First boot? The initial login is documented in the README. Change the password immediately.</li>
          <li>• On serverless, set <code className="font-mono">DATABASE_URL</code> to a persistent Postgres database. Set <code className="font-mono">JWT_SECRET</code> (≥ 16 chars) everywhere.</li>
          <li>• Forgot the password? Run <code className="font-mono">node scripts/reset-admin.mjs --password=NewSecret123</code> with the SAME <code className="font-mono">DATABASE_URL</code> (or Docker volume) the live site uses.</li>
          <li>• Rate limited? Wait for the timer in the response; attempts are limited per IP and account.</li>
        </ul>
      </details>
    </form>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div className="h-72" aria-busy="true" />}>
      <LoginFormInner />
    </Suspense>
  );
}
