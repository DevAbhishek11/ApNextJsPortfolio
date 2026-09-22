"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./admin-sidebar";
import AdminTopbar from "./admin-topbar";
import AdminFooter from "./admin-footer";

// ---------------------------------------------------------------------------
// Admin chrome: fixed viewport shell — sidebar, topbar and footer never move;
// ONLY <main> scrolls. Also owns the mobile drawer state so the topbar's
// hamburger button and the sidebar drawer stay in sync.
// ---------------------------------------------------------------------------

export default function AdminChrome({
  children,
  userName,
  unreadMessages,
}: {
  children: React.ReactNode;
  userName: string;
  unreadMessages: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer on every navigation.
  useEffect(() => setMobileOpen(false), [pathname]);

  // Esc closes the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="admin-shell flex h-svh overflow-hidden bg-adm-bg text-adm-text">
      <AdminSidebar
        unreadMessages={unreadMessages}
        name={userName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <AdminTopbar
          userName={userName}
          unreadMessages={unreadMessages}
          onMenuOpen={() => setMobileOpen(true)}
        />
        <main id="admin-main" className="admin-scroll min-w-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {children}
        </main>
        <AdminFooter userName={userName} />
      </div>
    </div>
  );
}
