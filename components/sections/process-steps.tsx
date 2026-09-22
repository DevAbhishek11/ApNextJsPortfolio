"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/components/animation/gsap-provider";
import { Search, PenTool, Code2, TestTube2, Rocket, LifeBuoy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const steps: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Discovery",
    description:
      "Goals, users, and constraints on one page — so we solve the right problem before writing a line of code.",
    icon: Search,
  },
  {
    title: "Design",
    description:
      "Wireframes to high-fidelity Figma screens with a shared token system, reviewed up front to kill revisions later.",
    icon: PenTool,
  },
  {
    title: "Development",
    description:
      "Type-safe, component-first builds in short agile sprints with visible progress every week.",
    icon: Code2,
  },
  {
    title: "Testing",
    description:
      "Unit tests on critical paths, API contract checks in Postman, and real-device passes before anything ships.",
    icon: TestTube2,
  },
  {
    title: "Deployment",
    description:
      "CI/CD pipelines to AWS with zero-downtime releases, rollback plans, and environments that match production.",
    icon: Rocket,
  },
  {
    title: "Support",
    description:
      "Post-launch monitoring, performance budgets, and a clear channel for iterations as your product grows.",
    icon: LifeBuoy,
  },
];

export default function ProcessSteps() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;

      const spine = root.querySelector("[data-spine]");
      if (spine) {
        gsap.fromTo(
          spine,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            transformOrigin: "top center",
            scrollTrigger: {
              trigger: root,
              start: "top 70%",
              end: "bottom 75%",
              scrub: 0.5,
            },
          },
        );
      }

      root.querySelectorAll<HTMLElement>("[data-step]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 86%",
              toggleActions: "play reverse play reverse",
            },
          },
        );
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative mx-auto max-w-3xl">
      <div className="absolute left-[22px] top-2 bottom-2 w-px bg-border" aria-hidden>
        <div data-spine className="h-full w-full origin-top bg-accent/50" />
      </div>
      <ol className="space-y-8">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title} data-step className="relative flex gap-5 pl-0 will-change-transform">
              <div
                className={cn(
                  "z-10 mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent shadow-card",
                )}
              >
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div className="flex-1 rounded-card border border-border bg-surface p-5 shadow-card transition-shadow duration-250 hover:shadow-card-hover">
                <p className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-medium text-faint">
                    0{i + 1}
                  </span>
                  <span className="font-semibold tracking-tight text-ink">{step.title}</span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
