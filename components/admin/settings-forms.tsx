"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import TagInput from "./tag-input";
import ImageInput from "./image-input";
import {
  changePasswordSchema, settingsSchema,
  type ChangePasswordInput, type SettingsInput,
} from "@/lib/validation/schemas";
import type { ApiResponse, Settings } from "@/lib/types";

// ---------------------------------------------------------------------------
// Profile + SEO + theme settings (single form, one save)
//
// `activeSection` / `hidden` let a parent (see settings-tabs.tsx) render this
// as one panel of a tab set without splitting the underlying <form>: every
// field stays mounted and registered even while its section is hidden, so
// nothing is lost when switching tabs, and Save always submits everything.
// Omit `activeSection` to render every section at once (original behavior).
// ---------------------------------------------------------------------------

export type SettingsSection = "profile" | "contact" | "seo" | "theme";

export function SettingsForm({
  initial,
  activeSection,
  hidden = false,
  idBase,
}: {
  initial: Settings;
  activeSection?: SettingsSection;
  hidden?: boolean;
  idBase?: string;
}) {
  const toast = useToast();
  const router = useRouter();

  const { register, control, handleSubmit, formState: { errors, isSubmitting, isDirty } } =
    useForm<z.input<typeof settingsSchema>, undefined, SettingsInput>({
      resolver: zodResolver(settingsSchema),
      defaultValues: initial,
    });

  const generatedIdBase = useId();
  const tabIdBase = idBase ?? generatedIdBase;
  const sectionHidden = (key: SettingsSection) =>
    activeSection !== undefined && activeSection !== key;

  const onSubmit = async (values: SettingsInput) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as ApiResponse<Settings>;
      if (!res.ok || !json.success) {
        toast.error(json.success ? "Save failed." : json.error.message);
        return;
      }
      toast.success("Settings saved — the public site reflects them immediately.");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate hidden={hidden} className="space-y-5">
      {/* Profile */}
      <section
        id={`${tabIdBase}-panel-profile`}
        role="tabpanel"
        aria-labelledby={`${tabIdBase}-tab-profile`}
        hidden={sectionHidden("profile")}
        className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card"
      >
        <h2 className="mb-1 text-sm font-semibold text-adm-text">Profile</h2>
        <p className="mb-5 text-xs text-adm-faint">
          Feeds the hero, about page, footer, and contact page — edit the whole site without touching code.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.profile?.name?.message} htmlFor="st-name">
            <Input id="st-name" area="adm" invalid={!!errors.profile?.name} {...register("profile.name")} />
          </Field>
          <Field label="Role / title" htmlFor="st-role">
            <Input id="st-role" area="adm" {...register("profile.role")} />
          </Field>
          <Field label="Tagline" htmlFor="st-tagline">
            <Input id="st-tagline" area="adm" placeholder="MERN Stack · Next.js · React Native" {...register("profile.tagline")} />
          </Field>
          <Field label="Availability text" htmlFor="st-availability">
            <Input id="st-availability" area="adm" {...register("profile.availability")} />
          </Field>
          <Field label="Rotating hero roles" hint="Typed one by one in the hero headline.">
            <Controller
              control={control}
              name="profile.roles"
              render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} max={8} placeholder="Full Stack Developer…" />
              )}
            />
          </Field>
          <Field label="Languages">
            <Controller
              control={control}
              name="profile.languages"
              render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} max={12} placeholder="English (Professional)…" />
              )}
            />
          </Field>
          <Field label="Interests" className="sm:col-span-2">
            <Controller
              control={control}
              name="profile.interests"
              render={({ field }) => (
                <TagInput value={field.value ?? []} onChange={field.onChange} max={12} placeholder="Open source…" />
              )}
            />
          </Field>
          <Field label="Bio" className="sm:col-span-2" hint="Separate paragraphs with a blank line — shown on the About page.">
            <Textarea id="st-bio" area="adm" rows={8} {...register("profile.bio")} />
          </Field>
        </div>
      </section>

      {/* Contact + socials */}
      <section
        id={`${tabIdBase}-panel-contact`}
        role="tabpanel"
        aria-labelledby={`${tabIdBase}-tab-contact`}
        hidden={sectionHidden("contact")}
        className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card"
      >
        <h2 className="mb-5 text-sm font-semibold text-adm-text">Contact & socials</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="st-email">
            <Input id="st-email" area="adm" type="email" {...register("profile.email")} />
          </Field>
          <Field label="Phone" htmlFor="st-phone">
            <Input id="st-phone" area="adm" {...register("profile.phone")} />
          </Field>
          <Field label="Location" htmlFor="st-location">
            <Input id="st-location" area="adm" {...register("profile.location")} />
          </Field>
          <Field label="Résumé URL" hint="/resume.pdf or external link" htmlFor="st-resume">
            <Input id="st-resume" area="adm" {...register("profile.resumeUrl")} />
          </Field>
          <Field label="GitHub URL" htmlFor="st-github">
            <Input id="st-github" area="adm" {...register("profile.socials.github")} />
          </Field>
          <Field label="LinkedIn URL" htmlFor="st-linkedin">
            <Input id="st-linkedin" area="adm" {...register("profile.socials.linkedin")} />
          </Field>
        </div>
        <div className="mt-4 max-w-xs">
          <Field label="Avatar" htmlFor="st-avatar">
            <Controller
              control={control}
              name="profile.avatar"
              render={({ field }) => (
                <ImageInput value={field.value ?? ""} onChange={field.onChange} label="Pick avatar" aspect="aspect-square" />
              )}
            />
          </Field>
        </div>
      </section>

      {/* SEO */}
      <section
        id={`${tabIdBase}-panel-seo`}
        role="tabpanel"
        aria-labelledby={`${tabIdBase}-tab-seo`}
        hidden={sectionHidden("seo")}
        className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card"
      >
        <h2 className="mb-5 text-sm font-semibold text-adm-text">SEO defaults</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Site name" required error={errors.site?.name?.message} htmlFor="st-sitename">
            <Input id="st-sitename" area="adm" invalid={!!errors.site?.name} {...register("site.name")} />
          </Field>
          <Field label="Title template" hint="%s is replaced with the page title" htmlFor="st-title-tpl">
            <Input id="st-title-tpl" area="adm" {...register("site.titleTemplate")} />
          </Field>
          <Field label="Default meta description" className="sm:col-span-2" htmlFor="st-desc">
            <Textarea id="st-desc" area="adm" rows={2} {...register("site.defaultDescription")} />
          </Field>
          <Field label="Default OG image URL" htmlFor="st-og">
            <Input id="st-og" area="adm" {...register("site.defaultOgImage")} />
          </Field>
          <Field label="Analytics ID" hint="Optional (e.g. GA4 measurement ID)" htmlFor="st-analytics">
            <Input id="st-analytics" area="adm" {...register("site.analyticsId")} />
          </Field>
        </div>
      </section>

      {/* Theme */}
      <section
        id={`${tabIdBase}-panel-theme`}
        role="tabpanel"
        aria-labelledby={`${tabIdBase}-tab-theme`}
        hidden={sectionHidden("theme")}
        className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card"
      >
        <h2 className="mb-1 text-sm font-semibold text-adm-text">Admin theme default</h2>
        <p className="mb-5 text-xs text-adm-faint">
          Used when no local preference exists yet (your personal toggle lives in the top bar).
        </p>
        <Field label="Default theme" htmlFor="st-theme">
          <Select id="st-theme" area="adm" className="max-w-xs" {...register("theme.adminDefault")}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </Select>
        </Field>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty && false} className="shadow-md">
          <Save size={15} /> Save settings
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Change password (separate section — invalidates sessions on success)
// ---------------------------------------------------------------------------

export function PasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ChangePasswordInput>({
      resolver: zodResolver(changePasswordSchema),
      defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

  const onSubmit = async (values: ChangePasswordInput) => {
    setServerError(null);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !json.success) {
        const msg = json.success ? "Something went wrong." : json.error.message;
        setServerError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Password changed — you'll be asked to sign in again.");
      setTimeout(() => {
        router.replace("/admin/login");
        router.refresh();
      }, 1200);
    } catch {
      setServerError("Network error — please try again.");
    }
  };

  return (
    <form
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card"
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-adm-text">
        <KeyRound size={16} className="text-accent" /> Change password
      </h2>
      <p className="mb-5 mt-1 text-xs text-adm-faint">
        All active sessions are invalidated on change — you&apos;ll be signed out everywhere.
      </p>
      <div className="grid max-w-lg gap-4">
        {serverError && (
          <p role="alert" className="rounded-control border border-red-400/50 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-500">
            {serverError}
          </p>
        )}
        <Field label="Current password" required error={errors.currentPassword?.message} htmlFor="pw-current">
          <Input id="pw-current" area="adm" type="password" autoComplete="current-password" invalid={!!errors.currentPassword} {...register("currentPassword")} />
        </Field>
        <Field label="New password" required error={errors.newPassword?.message} hint="Min 8 chars with letters and numbers." htmlFor="pw-new">
          <Input id="pw-new" area="adm" type="password" autoComplete="new-password" invalid={!!errors.newPassword} {...register("newPassword")} />
        </Field>
        <Field label="Confirm new password" required error={errors.confirmPassword?.message} htmlFor="pw-confirm">
          <Input id="pw-confirm" area="adm" type="password" autoComplete="new-password" invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        </Field>
        <div>
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </div>
      </div>
    </form>
  );
}
