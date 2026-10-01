import type { Metadata } from "next";
import Hero from "@/components/sections/hero";
import StatsStrip from "@/components/sections/stats-strip";
import SkillsGrid from "@/components/sections/skills-grid";
import FeaturedProjects from "@/components/sections/featured-projects";
import ExperiencePreview from "@/components/sections/experience-preview";
import LatestPosts from "@/components/sections/latest-posts";
import CTABanner from "@/components/sections/cta-banner";
import {
  getBlogPosts,
  getExperience,
  getFeaturedProjects,
  getSettings,
  getSkills,
} from "@/lib/db/cached";
import { buildMetadata, jsonLdScript, personJsonLd, websiteJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings.site, { path: "/" });
}

export default async function HomePage() {
  const [settings, projects, posts, experience, skills] = await Promise.all([
    getSettings(),
    getFeaturedProjects(),
    getBlogPosts(),
    getExperience(),
    getSkills(),
  ]);
  const { profile } = settings;

  return (
    // Clip off-canvas reveal animations without creating a horizontal scroll container.
    <div className="min-w-0 overflow-x-clip [overflow-wrap:anywhere]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([personJsonLd(profile, settings.site), websiteJsonLd(profile)]),
        }}
      />
      <Hero
        name={profile.name}
        tagline={profile.tagline}
        roles={profile.roles}
        location={profile.location}
        availability={profile.availability}
        resumeUrl={profile.resumeUrl}
      />
      <StatsStrip />
      <SkillsGrid groups={skills.slice(0, 6)} title="Featured skills" />
      {projects.length > 0 && <FeaturedProjects projects={projects} />}
      <ExperiencePreview entries={experience} />
      <LatestPosts posts={posts} />
      <CTABanner email={profile.email} wrapEmail />
    </div>
  );
}
