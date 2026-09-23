import type { Metadata } from "next";
import { Suspense } from "react";
import { SettingsTabs } from "@/components/admin/settings-tabs";
import { settingsRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const settings = await settingsRepo.get();
  return (
    <div className="mx-auto">
      <Suspense fallback={null}>
        <SettingsTabs initial={settings} />
      </Suspense>
    </div>
  );
}