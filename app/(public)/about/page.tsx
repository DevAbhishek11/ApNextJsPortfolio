import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, Download, GraduationCap, Languages, Sparkles } from "lucide-react";
import PageHeader from "@/components/sections/page-header";
import ExperienceTimeline from "@/components/sections/experience-timeline";
import SkillsMatrix from "@/components/sections/skills-matrix";
import CTABanner from "@/components/sections/cta-banner";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "@/components/sections/section-heading";
import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { Badge } from "@/components/ui/surface";
import {
  getCertifications,
  getEducation,
  getExperience,
  getSettings,
  getSkills,
} from "@/lib/db/cached";
import { buildMetadata, jsonLdScript, personJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings.site, {
    title: "About",
    description:
      "Full Stack Developer with 2.5+ years of production experience — MERN stack, Next.js, React Native, real-time systems, and AWS-deployed infrastructure.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const [settings, experience, skills, certifications, education] = await Promise.all([
    getSettings(),
    getExperience(),
    getSkills(),
    getCertifications(),
    getEducation(),
  ]);
  const { profile } = settings;
  const paragraphs = profile.bio.split(/\n+/).filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(personJsonLd(profile, settings.site)) }}
      />
      <PageHeader
        eyebrow="About"
        title="Builder of production systems, not just demos"
        description="2.5+ years shipping scalable web and mobile applications — from real-time chat at 500+ concurrent users to a revamp that grew traffic 40%."
      />

      {/* Bio */}
      <Section>
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">
            <Reveal variant="scale">
              <div className="mx-auto w-full max-w-[300px] lg:sticky lg:top-24">
                <div className="relative aspect-square overflow-hidden rounded-card border border-border bg-surface-2 shadow-card">
                  <Image
                    src={profile.avatar}
                    alt={`Portrait of ${profile.name}`}
                    fill
                    sizes="(max-width: 1024px) 300px, 300px"
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="mt-4 rounded-card border border-border bg-surface p-4 shadow-card">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span className="animate-pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
                    {profile.availability}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{profile.location}</p>
                </div>
                {profile.resumeUrl && (
                  <a
                    href={profile.resumeUrl}
                    download
                    className="mt-3 flex h-11 items-center justify-center gap-2 rounded-control border border-border bg-surface text-sm font-semibold text-ink shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong"
                  >
                    <Download size={15} /> Download résumé (PDF)
                  </a>
                )}
              </div>
            </Reveal>
            <div>
              <Reveal variant="rise">
                <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  Hi — I&apos;m Abhishek
                </h2>
              </Reveal>
              {paragraphs.map((p, i) => (
                <Reveal key={i} variant="rise" delay={0.06 * (i + 1)}>
                  <p className="mt-5 text-[1.02rem] leading-[1.8] text-muted">{p}</p>
                </Reveal>
              ))}
              <Reveal variant="rise" delay={0.3}>
                <div className="mt-7 flex flex-wrap gap-2">
                  {profile.tagline.split("·").map((t) => (
                    <Badge key={t} tone="accent">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* Skills matrix */}
      <div className="border-t border-border bg-surface-2/40 py-16 sm:py-24 lg:py-28">
        <SkillsMatrix groups={skills} />
      </div>

      {/* Experience timeline */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Career"
            title="Work experience"
            description="Production ownership across two teams — from first sprint to infrastructure."
          />
          <ExperienceTimeline entries={experience} />
        </Container>
      </Section>

      {/* Certifications */}
      <Section className="border-t border-border bg-surface-2/40">
        <Container>
          <SectionHeading
            eyebrow="Credentials"
            title="Certifications"
            description="Formal validation of the same skills I use daily."
          />
          <RevealGroup className="grid gap-4 sm:grid-cols-2" stagger={0.07}>
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex gap-4 rounded-card border border-border bg-surface p-5 shadow-card transition-all duration-250 hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="rounded-xl bg-accent-soft p-2.5 text-accent">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <h3 className="font-semibold leading-snug tracking-tight text-ink">
                    {cert.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-faint">
                    {cert.issuer} · {cert.year}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{cert.description}</p>
                </div>
              </div>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* Education + Languages + Interests */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <SectionHeading eyebrow="Education" title="Education" align="left" />
              <RevealGroup className="space-y-4" stagger={0.08}>
                {education.map((edu) => (
                  <div
                    key={edu.id}
                    className="flex gap-4 rounded-card border border-border bg-surface p-5 shadow-card"
                  >
                    <div className="rounded-xl bg-accent-soft p-2.5 text-accent">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold leading-snug tracking-tight text-ink">
                        {edu.degree}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-faint">
                        {edu.institution} · {edu.startYear}–{edu.endYear}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{edu.details}</p>
                    </div>
                  </div>
                ))}
              </RevealGroup>
            </div>
            <div>
              <SectionHeading eyebrow="Beyond code" title="Languages & interests" align="left" />
              <Reveal variant="rise">
                <div className="rounded-card border border-border bg-surface p-6 shadow-card">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Languages size={16} className="text-accent" /> Languages
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.languages.map((l) => (
                      <Badge key={l} tone="neutral">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal variant="rise" delay={0.1}>
                <div className="mt-4 rounded-card border border-border bg-surface p-6 shadow-card">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Sparkles size={16} className="text-accent" /> What I do for fun
                  </p>
                  <ul className="mt-3 space-y-2">
                    {profile.interests.map((interest) => (
                      <li key={interest} className="flex gap-2.5 text-sm text-muted">
                        <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                        {interest}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      <CTABanner email={profile.email} />
    </>
  );
}
