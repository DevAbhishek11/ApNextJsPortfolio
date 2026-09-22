import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminChrome from "@/components/admin/admin-chrome";
import { ToastProvider } from "@/components/ui/toast";
import { getSessionUser } from "@/lib/auth/guard";
import { messagesRepo } from "@/lib/db/repos";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Full server-side session validation — the proxy in proxy.ts only does a
  // fast signature check; here we verify the user still exists and its
  // tokenVersion matches (i.e. password hasn't changed since login).
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");

  const unreadMessages = await messagesRepo.unreadCount();

  return (
    <ToastProvider>
      <AdminChrome userName={user.name} unreadMessages={unreadMessages}>
        {children}
      </AdminChrome>
    </ToastProvider>
  );
}
