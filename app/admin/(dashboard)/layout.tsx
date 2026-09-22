import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";
import AdminTopbar from "@/components/admin/admin-topbar";
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
      <div className="admin-shell flex min-h-svh bg-adm-bg text-adm-text">
        <AdminSidebar unreadMessages={unreadMessages} name={user.name} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar userName={user.name} unreadMessages={unreadMessages} />
          <main className="min-w-0 flex-1 p-5 sm:p-7">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
