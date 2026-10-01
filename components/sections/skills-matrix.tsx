import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "./section-heading";
import { RevealGroup } from "@/components/animation/reveal";
import { cn } from "@/lib/utils";
import type { SkillGroup } from "@/lib/types";

function LevelDots({ level }: { level: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1" aria-label={`Proficiency ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "h-[5px] w-[5px] rounded-full",
            i < level ? "bg-accent" : "bg-border-strong",
          )}
        />
      ))}
    </span>
  );
}

export default function SkillsMatrix({ groups }: { groups: SkillGroup[] }) {
  return (
    <Section className="pt-0 sm:pt-0 lg:pt-0">
      <Container>
        <SectionHeading
          eyebrow="Toolkit"
          title="Skills & proficiency"
          description="Depth where it counts — battle-tested in production codebases, not tutorial demos."
        />
        <RevealGroup className="grid gap-4 lg:grid-cols-2" stagger={0.06}>
          {groups.map((group) => (
            <div
              key={group.category}
              className="rounded-card border border-border bg-surface p-6 shadow-card"
            >
              <h3 className="text-[0.98rem] font-semibold text-ink">{group.category}</h3>
              <ul className="mt-4 space-y-2.5">
                {group.skills.map((skill) => (
                  <li
                    key={skill.name}
                    className="flex items-center justify-between gap-4 border-b border-border/60 pb-2.5 last:border-none last:pb-0"
                  >
                    <span className="min-w-0 text-sm text-muted">{skill.name}</span>
                    <LevelDots level={skill.level} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
