"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from "./gsap-provider";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ScrollReveal primitives — all bidirectional (play forward on scroll down,
// reverse on scroll up) via toggleActions: "play reverse play reverse".
// Only transform + opacity are ever animated (GPU-friendly, no layout shift).
// ---------------------------------------------------------------------------

type Variant = "rise" | "left" | "right" | "scale" | "fade";

const fromVars: Record<Variant, gsap.TweenVars> = {
  rise: { y: 60, opacity: 0 },
  left: { x: -44, opacity: 0 },
  right: { x: 44, opacity: 0 },
  scale: { scale: 0.94, opacity: 0 },
  fade: { opacity: 0 },
};

export function Reveal({
  children,
  variant = "rise",
  delay = 0,
  duration = 0.9,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "span" | "h1" | "h2" | "h3" | "p" | "li" | "figure";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (prefersReducedMotion()) {
        gsap.set(el, { clearProps: "all" });
        return;
      }
      gsap.fromTo(el, fromVars[variant], {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play reverse play reverse",
        },
      });
    },
    { scope: ref },
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cn("will-change-transform", className)}>
      {children}
    </Tag>
  );
}

/**
 * Staggered rise for a grid/list of elements.
 * Uses ScrollTrigger.batch for performance on large repeated grids.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
  variant = "rise",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  variant?: Variant;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = ref.current;
      if (!container) return;
      const items = Array.from(container.children) as HTMLElement[];
      if (items.length === 0) return;
      if (prefersReducedMotion()) {
        gsap.set(items, { clearProps: "all" });
        return;
      }
      gsap.set(items, { ...fromVars[variant], willChange: "transform, opacity" });
      ScrollTrigger.batch(items, {
        start: "top 90%",
        onEnter: (batch) =>
          gsap.to(batch, {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.85,
            stagger,
            ease: "power3.out",
            overwrite: true,
          }),
        onLeaveBack: (batch) =>
          gsap.to(batch, {
            ...fromVars[variant],
            duration: 0.5,
            stagger: stagger / 2,
            ease: "power2.in",
            overwrite: true,
          }),
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
