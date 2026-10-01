import { ArrowRight, Briefcase } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "./section-heading";
import { Reveal } from "@/components/animation/reveal";
import { ButtonLink } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/utils";
import type { ExperienceEntry } from "@/lib/types";

export default function ExperiencePreview({ entries }: { entries: ExperienceEntry[] }) {
  const top = [...entries].slice(0, 2);
  if (top.length === 0) return null;

  return (
    <Section>
      <Container>
        <SectionHeading
          eyebrow="Journey"
          title="Experience"
          description="Two and a half years of production work across agencies and product teams."
        />
        <div className="mx-auto max-w-3xl space-y-5">
          {top.map((entry, i) => (
            <Reveal key={entry.id} variant={i % 2 === 0 ? "left" : "right"}>
              <article className="relative rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-250 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="mt-0.5 shrink-0 rounded-xl bg-accent-soft p-2.5 text-accent">
                      <Briefcase size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold tracking-tight text-ink">{entry.role}</h3>
                      <p className="mt-0.5 text-sm font-medium text-muted">
                        {entry.company} · {entry.location}
                      </p>
                    </div>
                  </div>
                  <p className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
                    {formatMonthYear(entry.startDate)} —{" "}
                    {entry.current ? "Present" : formatMonthYear(entry.endDate)}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{entry.summary}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="mt-10 text-center">
          <ButtonLink href="/about" variant="secondary">
            View Full Journey <ArrowRight size={15} />
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
