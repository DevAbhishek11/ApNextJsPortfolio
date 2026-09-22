import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getSettings } from "@/lib/db/cached";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings.site, { path: "/" });
}

/**
 * Applies BOTH theme scopes to <html> BEFORE first paint so nothing flashes:
 *  - admin routes use the independent `ap-admin-theme` preference
 *  - public routes use `ap-theme` (falling back to the OS preference)
 * Also mirrors effective dark mode into `color-scheme` for native controls.
 */
const themeBootScript = `
(function () {
  try {
    var isAdmin = location.pathname.startsWith("/admin");
    var stored = localStorage.getItem(isAdmin ? "ap-admin-theme" : "ap-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    var meta = document.createElement("meta");
    meta.name = "color-scheme";
    meta.content = theme === "dark" ? "dark" : "light";
    document.head.appendChild(meta);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">{children}</body>
    </html>
  );
}
