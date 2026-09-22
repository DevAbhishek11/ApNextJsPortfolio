import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { Tag } from "@/components/ui/surface";
import type { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all duration-250 hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        <Image
          src={project.featureImage}
          alt={`${project.title} — interface preview`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute bottom-3 right-3 flex translate-y-2 items-center gap-1.5 rounded-control bg-surface/95 px-3 py-1.5 text-xs font-semibold text-ink opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          View Case Study <ArrowUpRight size={13} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[1.05rem] font-semibold tracking-tight text-ink transition-colors duration-150 group-hover:text-accent">
          {project.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {project.shortDescription}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 4).map((tech) => (
            <Tag key={tech}>{tech}</Tag>
          ))}
          {project.techStack.length > 4 && <Tag>+{project.techStack.length - 4}</Tag>}
        </div>
      </div>
    </Link>
  );
}
