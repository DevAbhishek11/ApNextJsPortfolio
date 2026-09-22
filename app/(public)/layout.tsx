import GsapProvider from "@/components/animation/gsap-provider";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { ToastProvider } from "@/components/ui/toast";
import { getSettings } from "@/lib/db/cached";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <GsapProvider>
      <ToastProvider>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-control focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-ink"
        >
          Skip to content
        </a>
        <Navbar name={settings.profile.name} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer profile={settings.profile} />
      </ToastProvider>
    </GsapProvider>
  );
}
