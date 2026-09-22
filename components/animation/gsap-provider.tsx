"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

// Register once, module-level, client-only (this file is "use client").
gsap.registerPlugin(ScrollTrigger, useGSAP);

export { gsap, ScrollTrigger, useGSAP };

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * App-wide animation provider:
 * - Registers GSAP + ScrollTrigger.
 * - Optional Lenis smooth-scroll (skipped for reduced-motion users), synced
 *   with ScrollTrigger through gsap.ticker.
 * - Refreshes ScrollTrigger on route change and kills stale triggers so SPA
 *   navigation never leaks animations.
 */
export default function GsapProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<{ destroy: () => void } | null>(null);

  // Lenis smooth scroll — dynamically imported so it never weighs down SSR/bundle init.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let destroyed = false;
    const tickRef: { current: ((time: number) => void) | null } = { current: null };

    import("lenis")
      .then(({ default: Lenis }) => {
        if (destroyed) return;
        const lenis = new Lenis({
          duration: 1.1,
          smoothWheel: true,
          syncTouch: false,
        });
        lenisRef.current = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        tickRef.current = tick;
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      })
      .catch(() => undefined);

    return () => {
      destroyed = true;
      if (tickRef.current) gsap.ticker.remove(tickRef.current);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Route-change hygiene: kill any ScrollTriggers left over from the previous
  // page's unmounted components, then let new components mount & build theirs.
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 60);
    return () => {
      clearTimeout(timer);
      // Components created inside gsap.context() revert themselves on unmount;
      // this catches anything that slipped through.
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger && !document.contains(t.trigger)) t.kill();
      });
    };
  }, [pathname]);

  return <>{children}</>;
}
