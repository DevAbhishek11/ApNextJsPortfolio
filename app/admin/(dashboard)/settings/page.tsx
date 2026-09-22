import type { Metadata } from "next";
import { PasswordForm, SettingsForm } from "@/components/admin/settings-forms";
import { settingsRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await settingsRepo.get();
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <SettingsForm initial={settings} />
      <PasswordForm />
    </div>
  );
}
