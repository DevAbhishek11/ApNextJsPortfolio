"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "./gsap-provider";

/**
 * Animated numeric counter that tweens from 0 → value once in view
 * (reverses when scrolling back above the trigger, like every other
 * scroll animation on the site).
 */
export function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
  duration = 1.6,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const objRef = useRef({ v: 0 });

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const render = () => {
        el.textContent = `${prefix}${objRef.current.v.toFixed(decimals)}${suffix}`;
      };
      if (prefersReducedMotion()) {
        objRef.current.v = value;
        render();
        return;
      }
      gsap.fromTo(
        objRef.current,
        { v: 0 },
        {
          v: value,
          duration,
          ease: "power2.out",
          onUpdate: render,
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play reverse play reverse",
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
