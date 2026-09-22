"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Download, MapPin } from "lucide-react";
import { ParallaxLayer } from "@/components/animation/parallax";
import { gsap, useGSAP, prefersReducedMotion } from "@/components/animation/gsap-provider";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Home hero: typed rotating roles, gradient-mesh + grid background with
// parallax, dual CTAs, availability badge, scroll indicator.
// ---------------------------------------------------------------------------

function TypedRoles({ roles }: { roles: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(roles[0] ?? "");
      return;
    }
    const full = roles[index % roles.length] ?? "";
    const speed = deleting ? 32 : 62;
    const timer = setTimeout(() => {
      if (!deleting) {
        const next = full.slice(0, text.length + 1);
        setText(next);
        if (next === full) setTimeout(() => setDeleting(true), 1800);
      } else {
        const next = full.slice(0, text.length - 1);
        setText(next);
        if (next === "") {
          setDeleting(false);
          setIndex((i) => (i + 1) % roles.length);
        }
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [text, deleting, index, roles]);

  return (
    <span className="text-accent">
      {text}
      <span aria-hidden className="animate-blink ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.12em] bg-accent" />
    </span>
  );
}

export default function Hero({
  name,
  tagline,
  roles,
  location,
  availability,
  resumeUrl,
}: {
  name: string;
  tagline: string;
  roles: string[];
  location: string;
  availability: string;
  resumeUrl: string;
}) {
  const rootRef = useRef<HTMLElement>(null);

  // Entrance choreography on mount (above-the-fold, not scroll-triggered)
  useGSAP(
    () => {
      if (prefersReducedMotion() || !rootRef.current) return;
      const items = rootRef.current.querySelectorAll("[data-hero]");
      gsap.set(items, { opacity: 0, y: 26 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.11,
        ease: "power3.out",
        delay: 0.15,
      });
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-16"
    >
      {/* Background layers (parallax, transform-only) */}
      <ParallaxLayer className="absolute inset-0" speed={10}>
        <div className="hero-mesh" />
      </ParallaxLayer>
      <div className="hero-grid" aria-hidden />
      <div
        aria-hidden
        className="absolute left-1/2 top-24 h-56 w-56 -translate-x-[30rem] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-3xl">
          <div
            data-hero="badge"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur"
          >
            <span className="animate-pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
            {availability}
          </div>

          <h1
            data-hero="title"
            className="mt-7 text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] text-ink sm:text-6xl lg:text-[4.6rem]"
          >
            {name.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="bg-gradient-to-r from-accent to-teal-500 bg-clip-text text-transparent">
              {name.split(" ").slice(-1)}
            </span>
          </h1>

          <p
            data-hero="role"
            className="mt-5 h-8 text-xl font-medium tracking-tight text-ink sm:text-2xl"
            aria-label={`Roles: ${roles.join(", ")}`}
          >
            <TypedRoles roles={roles.length ? roles : ["Full Stack Developer"]} />
          </p>

          <p data-hero="sub" className="mt-5 max-w-xl text-[1.06rem] leading-relaxed text-muted">
            I design and ship scalable web & mobile products end-to-end — {tagline.toLowerCase()}{" "}
            — with a track record of real-time systems, measurable growth, and production apps used
            by thousands.
          </p>

          <div data-hero="cta" className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/projects"
              className="group inline-flex h-12 items-center gap-2 rounded-control bg-accent px-6 text-[0.95rem] font-semibold text-accent-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
            >
              View Projects
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a
              href={resumeUrl || "/contact"}
              className="inline-flex h-12 items-center gap-2 rounded-control border border-border bg-surface px-6 text-[0.95rem] font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong"
              {...(resumeUrl ? { download: true } : {})}
            >
              <Download size={16} />
              {resumeUrl ? "Download Resume" : "Contact Me"}
            </a>
            <span className="inline-flex items-center gap-1.5 text-sm text-faint">
              <MapPin size={14} /> {location}
            </span>
          </div>
        </div>
      </div>

      <div
        data-hero="scroll"
        className={cn(
          "absolute bottom-8 left-1/2 -translate-x-1/2 text-faint",
        )}
        aria-hidden
      >
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[0.65rem] font-medium uppercase tracking-[0.25em]">Scroll</span>
          <ChevronDown size={18} className="animate-bounce" />
        </div>
      </div>
    </section>
  );
}
