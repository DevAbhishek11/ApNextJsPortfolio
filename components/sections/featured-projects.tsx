import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "./section-heading";
import { RevealGroup } from "@/components/animation/reveal";
import { ButtonLink } from "@/components/ui/button";
import ProjectCard from "@/components/projects/project-card";
import type { Project } from "@/lib/types";

export default function FeaturedProjects({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;
  return (
    <Section className="bg-surface-2/50">
      <Container>
        <SectionHeading
          eyebrow="Selected work"
          title="Featured projects"
          description="A few production platforms I'm proud of — real users, real constraints, real impact."
        />
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 3).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </RevealGroup>
        <div className="mt-12 text-center">
          <ButtonLink href="/projects" variant="secondary">
            Browse all projects <ArrowRight size={15} />
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
