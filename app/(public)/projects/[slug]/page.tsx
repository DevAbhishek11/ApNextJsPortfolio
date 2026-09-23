import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ArrowRight } from "lucide-react";
import { GithubIcon } from "@/components/ui/brand-icons";
import { Container, Section } from "@/components/ui/container";
import { Reveal } from "@/components/animation/reveal";
import { Tag } from "@/components/ui/surface";
import GalleryLightbox from "@/components/projects/gallery-lightbox";
import ProjectCard from "@/components/projects/project-card";
import { RevealGroup } from "@/components/animation/reveal";
import { getProjectBySlug, getProjects, getSettings } from "@/lib/db/cached";
import { buildMetadata, jsonLdScript, projectJsonLd, breadcrumbJsonLd } from "@/lib/seo";

// Detail pages render on demand so CMS-driven deletes/yet-unseen slugs
// return a *real* 404 status (ISR + notFound() can serve a 200 soft-404).
export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProjectBySlug(slug), getSettings()]);
  if (!project) return { title: "Project not found" };
  return buildMetadata(settings.site, {
    title: project.title,
    description: project.shortDescription,
    path: `/projects/${project.slug}`,
    image: project.featureImage,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProjectBySlug(slug), getProjects()]);
  if (!project || project.status !== "published") notFound();

  const related = all
    .filter((p) => p.id !== project.id)
    .sort((a, b) => {
      const shared = (x: typeof a) =>
        x.techStack.filter((t) => project.techStack.includes(t)).length;
      return shared(b) - shared(a);
    })
    .slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            projectJsonLd(project),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Projects", url: "/projects" },
              { name: project.title, url: `/projects/${project.slug}` },
            ]),
          ]),
        }}
      />

      <section className="relative overflow-hidden border-b border-border pt-16">
        <div className="hero-grid" aria-hidden />
        <Container className="relative pb-10 pt-14 sm:pt-16">
          <Reveal variant="fade">
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft size={15} /> All projects
            </Link>
          </Reveal>
          <Reveal variant="rise" delay={0.06}>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              {project.title}
            </h1>
          </Reveal>
          <Reveal variant="rise" delay={0.12}>
            <p className="mt-4 max-w-2xl text-[1.06rem] leading-relaxed text-muted">
              {project.shortDescription}
            </p>
          </Reveal>
          <Reveal variant="rise" delay={0.18}>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted">
              {project.role && (
                <span>
                  <span className="text-faint">Role:</span>{" "}
                  <span className="font-medium text-ink">{project.role}</span>
                </span>
              )}
              {project.timeline && (
                <span>
                  <span className="text-faint">Timeline:</span>{" "}
                  <span className="font-medium text-ink">{project.timeline}</span>
                </span>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
                >
                  Live site <ArrowUpRight size={13} />
                </a>
              )}
              {project.secondaryLiveUrl && (
                <a
                  href={project.secondaryLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-accent transition-colors hover:text-accent-hover"
                >
                  Alternate domain <ArrowUpRight size={13} />
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-muted transition-colors hover:text-ink"
                >
                  <GithubIcon size={14} /> Source
                </a>
              )}
            </div>
          </Reveal>
        </Container>
      </section>

      <Section className="pt-10 sm:pt-12 lg:pt-14">
        <Container>
          <Reveal variant="scale">
            <figure className="relative aspect-[16/8] overflow-hidden rounded-[1.25rem] border border-border bg-surface-2 shadow-card">
              <Image
                src={project.featureImage}
                alt={`${project.title} — main interface`}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1200px"
                className="object-cover"
              />
            </figure>
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
            <div>
              <Reveal variant="rise">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">Overview</h2>
              </Reveal>
              <Reveal variant="rise" delay={0.08}>
                <div
                  className="richtext mt-4"
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              </Reveal>

              {project.challenges && (
                <Reveal variant="rise" delay={0.1}>
                  <div className="mt-10">
                    <h2 className="text-2xl font-semibold tracking-tight text-ink">
                      Challenges & solutions
                    </h2>
                    <div
                      className="richtext mt-4"
                      dangerouslySetInnerHTML={{ __html: project.challenges }}
                    />
                  </div>
                </Reveal>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <Reveal variant="left">
                <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                    Tech stack
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.techStack.map((tech) => (
                      <Tag key={tech}>{tech}</Tag>
                    ))}
                  </div>
                </div>
              </Reveal>
              {project.keyFeatures.length > 0 && (
                <Reveal variant="left" delay={0.08}>
                  <div className="rounded-card border border-border bg-surface p-5 shadow-card">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                      Key features
                    </p>
                    <ul className="mt-3 space-y-2">
                      {project.keyFeatures.map((f) => (
                        <li key={f.slice(0, 32)} className="flex gap-2 text-[0.84rem] leading-relaxed text-muted">
                          <span className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}
              <Reveal variant="left" delay={0.14}>
                <div className="rounded-card border border-accent/20 bg-accent-soft p-5">
                  <p className="text-sm font-semibold text-ink">Need something similar?</p>
                  <p className="mt-1 text-[0.84rem] leading-relaxed text-muted">
                    I build production systems like this end-to-end.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
                  >
                    Start a project <ArrowRight size={14} />
                  </Link>
                </div>
              </Reveal>
            </aside>
          </div>

          {project.gallery.length > 0 && (
            <div className="mt-16">
              <Reveal variant="rise">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">Gallery</h2>
              </Reveal>
              <div className="mt-6">
                <GalleryLightbox images={project.gallery} title={project.title} />
              </div>
            </div>
          )}
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="border-t border-border bg-surface-2/40">
          <Container>
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">Related projects</h2>
              <Link
                href="/projects"
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover sm:inline-flex"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </RevealGroup>
          </Container>
        </Section>
      )}
    </>
  );
}
