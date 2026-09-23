"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ArrowUpRight, Menu, X } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/brand-icons";
import ThemeToggle from "@/components/ui/theme-toggle";
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

/** Fires the custom event the global search dialog listens for. */
export function openSearch() {
  window.dispatchEvent(new CustomEvent("ap:open-search"));
}

export default function Navbar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const [progress, setProgress] = useState(0);

  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ x: 0, w: 0, show: false });

  // Scroll state + page progress (drives the gradient bar).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 20);
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Path-tied open state closes the menu on navigation without an effect.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Sliding active pill: measure rect-relative so offsets are correct even
  // with positioned list items, and re-measure after fonts swap in.
  const index = links.findIndex((l) => isActive(pathname, l.href));
  const layoutPill = () => {
    const el = index >= 0 ? itemRefs.current[index] : null;
    const list = listRef.current;
    if (!el || !list) {
      setPill((p) => ({ ...p, show: false }));
      return;
    }
    const itemRect = el.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    setPill({
      x: itemRect.left - listRect.left,
      w: itemRect.width,
      show: itemRect.width > 0,
    });
  };
  useLayoutEffect(layoutPill, [pathname, index]);
  useEffect(() => {
    window.addEventListener("resize", layoutPill);
    // Webfonts arriving after first paint shifts link widths — remeasure.
    document.fonts?.ready.then(layoutPill).catch(() => undefined);
    const t = setTimeout(layoutPill, 120); // settle after mount/navigation
    return () => {
      window.removeEventListener("resize", layoutPill);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, index]);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Reading progress bar */}
      <span
        className="scroll-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <header className="fixed inset-x-0 top-0 z-[70] px-4 pt-3 sm:px-6">
        <nav
          aria-label="Primary"
          className={cn(
            "nav-pill mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 rounded-full px-2.5 transition-all duration-300",
            scrolled && "shadow-md",
          )}
        >
          {/* Brand */}
          <Link href="/" className="group flex items-center gap-2.5 pl-1.5" aria-label="Home">
            <span className="ring-gradient rounded-full">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-[0.78rem] font-bold text-accent transition-transform duration-300 group-hover:-rotate-12">
                {initials}
              </span>
            </span>
            <span className="hidden text-[0.92rem] font-semibold tracking-tight sm:block">
              {name}
            </span>
          </Link>

          {/* Desktop links with sliding active pill */}
          <ul ref={listRef} className="relative hidden items-center lg:flex">
            <span
              aria-hidden
              className={cn(
                "nav-active-pill absolute inset-y-1 rounded-full",
                pill.show ? "opacity-100" : "opacity-0",
              )}
              style={{ width: `${pill.w}px`, transform: `translateX(${pill.x}px)` }}
            />
            {links.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative z-10 block rounded-full px-3.5 py-1.5 text-[0.83rem] font-medium transition-colors duration-200",
                      active ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right cluster */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Search (Ctrl+K)"
              className="group inline-flex h-9 items-center gap-2 rounded-full px-3 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Search size={15} />
              <span className="hidden text-[0.78rem] font-medium md:block">Search</span>
              <kbd className="kbd hidden md:inline-flex">⌘K</kbd>
            </button>
            <ThemeToggle />
            <Link
              href="/contact"
              onMouseEnter={() => router.prefetch("/contact")}
              className="btn-shine ml-1 hidden h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[0.83rem] font-semibold text-accent-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-md sm:inline-flex"
            >
              Let&apos;s talk <ArrowUpRight size={14} />
            </Link>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-2 lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpenPath((p) => p === pathname ? null : pathname)}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile full-screen glass menu */}
      <div
        className={cn(
          "fixed inset-0 z-[65] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            "bg-bg/70 backdrop-blur-2xl",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpenPath(null)}
          aria-hidden
        />
        <div
          className={cn(
            "absolute inset-x-4 top-20 origin-top rounded-3xl border p-6 transition-all duration-300",
            "glass-strong",
            open ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.97] opacity-0",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <ul className="space-y-1">
            {links.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <li
                  key={link.href}
                  style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}
                  className={cn(
                    "transition-all duration-300",
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                  )}
                >
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpenPath(null)}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl px-4 py-3.5",
                      active ? "bg-accent-soft text-accent" : "text-ink hover:bg-surface-2",
                    )}
                  >
                    <span className="flex items-baseline gap-3">
                      <span className="font-mono text-[0.68rem] text-faint">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xl font-semibold tracking-tight">{link.label}</span>
                    </span>
                    <ArrowUpRight
                      size={17}
                      className={cn(
                        "transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                        active ? "opacity-100" : "opacity-30",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div
            style={{ transitionDelay: open ? `${60 + links.length * 40}ms` : "0ms" }}
            className={cn(
              "mt-4 flex items-center justify-between border-t border-border pt-4 transition-all duration-300",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
            )}
          >
            <button
              type="button"
              onClick={() => {
                setOpenPath(null);
                requestAnimationFrame(openSearch);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted"
            >
              <Search size={13} /> Search the site <kbd className="kbd">⌘K</kbd>
            </button>
            <div className="flex items-center gap-1">
              <a href="https://github.com/DevAbhishek11" target="_blank" rel="noreferrer" aria-label="GitHub" className="p-2 text-muted transition-colors hover:text-ink">
                <GithubIcon size={16} />
              </a>
              <a href="https://www.linkedin.com/in/abhishek-prajapati-a9206030a/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="p-2 text-muted transition-colors hover:text-ink">
                <LinkedinIcon size={16} />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
