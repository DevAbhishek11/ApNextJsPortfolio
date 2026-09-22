import {
  Atom, Server, Database, Cloud, Radio, Sparkles, Wrench, Braces,
  type LucideIcon,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "./section-heading";
import { RevealGroup } from "@/components/animation/reveal";
import { Tag } from "@/components/ui/surface";
import type { SkillGroup } from "@/lib/types";

const categoryIcons: Record<string, LucideIcon> = {
  Frontend: Braces,
  Backend: Server,
  Databases: Database,
  "Cloud & DevOps": Cloud,
  "Real-Time": Radio,
  "AI & APIs": Sparkles,
  "Testing & Tools": Wrench,
};

export default function SkillsGrid({
  groups,
  title = "Technologies I work with",
  description = "A full-stack toolkit proven across production web platforms, cross-platform mobile apps, and AWS-deployed infrastructure.",
}: {
  groups: SkillGroup[];
  title?: string;
  description?: string;
}) {
  return (
    <Section>
      <Container>
        <SectionHeading eyebrow="Skills" title={title} description={description} />
        <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {groups.map((group) => {
            const Icon = categoryIcons[group.category] ?? Atom;
            return (
              <div
                key={group.category}
                className="group rounded-card border border-border bg-surface p-6 shadow-card transition-all duration-250 hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover"
              >
                <div className="mb-4 inline-flex rounded-xl bg-accent-soft p-2.5 text-accent transition-transform duration-200 group-hover:scale-110">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className="text-[0.98rem] font-semibold text-ink">{group.category}</h3>
                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => (
                    <Tag key={skill.name}>{skill.name}</Tag>
                  ))}
                </div>
              </div>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
