import type { Metadata } from "next";
import PageHeader from "@/components/sections/page-header";
import CTABanner from "@/components/sections/cta-banner";
import ProjectExplorer from "@/components/projects/project-explorer";
import { Container, Section } from "@/components/ui/container";
import { getProjects, getSettings } from "@/lib/db/cached";
import { buildMetadata, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings.site, {
    title: "Projects",
    description:
      "Case studies from production work: invoicing platforms, travel booking, food delivery apps, event portals, and CMS systems.",
    path: "/projects",
  });
}

export default async function ProjectsPage() {
  const [projects, settings] = await Promise.all([getProjects(), getSettings()]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Projects", url: "/projects" },
            ]),
          ),
        }}
      />
      <PageHeader
        eyebrow="Portfolio"
        title="Projects with production mileage"
        description="Invoice platforms, booking engines, food delivery apps and more — filter by stack to see exactly where each technology earned its keep."
      />
      <Section>
        <Container>
          <ProjectExplorer projects={projects} />
        </Container>
      </Section>
      <CTABanner email={settings.profile.email} />
    </>
  );
}
