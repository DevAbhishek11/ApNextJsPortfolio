"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar({ name }: { name: string }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[70] transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-bg/80 shadow-[0_1px_2px_rgba(16,16,20,0.04)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8"
        aria-label="Primary"
      >
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[0.82rem] font-bold text-accent-ink shadow-sm transition-transform duration-200 group-hover:-rotate-6">
            {initials}
          </span>
          <span className="text-[0.95rem] font-semibold tracking-tight">{name}</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                    active ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute inset-x-3.5 -bottom-px h-[2px] origin-left rounded-full bg-accent transition-transform duration-200",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden items-center gap-1.5 rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover md:inline-flex"
          >
            Let&apos;s talk <ArrowUpRight size={15} />
          </Link>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-control text-ink transition-colors hover:bg-surface-2 md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-in menu */}
      <div
        className={cn(
          "fixed inset-0 top-16 z-[60] md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[78%] max-w-xs border-l border-border bg-surface shadow-lg transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <ul className="flex flex-col gap-1 p-5">
            {links.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <li
                  key={link.href}
                  style={{ transitionDelay: open ? `${i * 30}ms` : "0ms" }}
                  className={cn(
                    "transition-all duration-300",
                    open ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
                  )}
                >
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-control px-4 py-3 text-[0.95rem] font-medium",
                      active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {link.label}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </Link>
                </li>
              );
            })}
            <li className="mt-3">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 rounded-control bg-accent px-4 py-3 text-[0.95rem] font-semibold text-accent-ink"
              >
                Let&apos;s talk <ArrowUpRight size={15} />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
