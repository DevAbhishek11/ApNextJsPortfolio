"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/components/animation/gsap-provider";
import { formatMonthYear } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ExperienceEntry } from "@/lib/types";

/**
 * Vertical work-experience timeline. The spine draws itself with a scrubbed
 * scaleY (bidirectional), entries alternate rising in from left/right.
 */
export default function ExperienceTimeline({ entries }: { entries: ExperienceEntry[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;

      // Spine draw — scrubbed both directions
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
              start: "top 75%",
              end: "bottom 80%",
              scrub: 0.5,
            },
          },
        );
      }

      // Entries — alternate directions, reversible
      root.querySelectorAll<HTMLElement>("[data-entry]").forEach((entry, i) => {
        const dot = entry.querySelector("[data-dot]");
        gsap.fromTo(
          entry,
          { x: i % 2 === 0 ? -40 : 40, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: entry,
              start: "top 85%",
              toggleActions: "play reverse play reverse",
            },
          },
        );
        if (dot) {
          gsap.fromTo(
            dot,
            { scale: 0 },
            {
              scale: 1,
              duration: 0.5,
              ease: "back.out(2.5)",
              scrollTrigger: {
                trigger: entry,
                start: "top 85%",
                toggleActions: "play reverse play reverse",
              },
            },
          );
        }
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="relative">
      {/* spine */}
      <div className="absolute left-[11px] top-1 bottom-1 w-px bg-border sm:left-1/2" aria-hidden>
        <div data-spine className="h-full w-full origin-top bg-accent/50" />
      </div>

      <div className="space-y-10">
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            data-entry
            className={cn(
              "relative pl-10 sm:w-[calc(50%-2rem)] sm:pl-0 will-change-transform",
              i % 2 === 0 ? "sm:mr-auto sm:pr-2 sm:text-right" : "sm:ml-auto sm:pl-2",
            )}
          >
            {/* dot */}
            <span
              data-dot
              aria-hidden
              className={cn(
                "absolute left-[4px] top-6 h-4 w-4 rounded-full border-[3px] border-bg bg-accent shadow-sm",
                i % 2 === 0
                  ? "sm:left-auto sm:right-[-2.56rem]"
                  : "sm:left-[-2.56rem]",
              )}
            />
            <article
              className={cn(
                "rounded-card border border-border bg-surface p-6 text-left shadow-card transition-shadow duration-250 hover:shadow-card-hover",
              )}
            >
              <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
                {formatMonthYear(entry.startDate)} —{" "}
                {entry.current ? "Present" : formatMonthYear(entry.endDate)}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">{entry.role}</h3>
              <p className="mt-0.5 text-sm font-medium text-muted">
                {entry.company} · {entry.location}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{entry.summary}</p>
              {entry.achievements.length > 0 && (
                <ul className="mt-4 space-y-2.5 border-t border-border pt-4 text-left">
                  {(entry.achievements.length > 4
                    ? entry.achievements.slice(0, 6)
                    : entry.achievements
                  ).map((a) => (
                    <li key={a.slice(0, 40)} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        ))}
      </div>
    </div>
  );
}
