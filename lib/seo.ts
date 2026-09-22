import type { Metadata } from "next";
import { baseUrl } from "@/lib/utils";
import type { BlogPost, Project, ProfileSettings, SiteSettings } from "@/lib/types";

// ---------------------------------------------------------------------------
// Metadata + JSON-LD builders. Public routes call buildMetadata() from
// generateMetadata, and pages embed the JSON-LD scripts produced here.
// ---------------------------------------------------------------------------

export function absoluteUrl(path: string): string {
  if (!path) return baseUrl();
  if (path.startsWith("http")) return path;
  return `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildTitle(site: SiteSettings, title?: string): string {
  if (!title) return `${site.name} — Full Stack Developer`;
  const tpl = site.titleTemplate || "%s | Abhishek Prajapati — Full Stack Developer";
  return tpl.includes("%s") ? tpl.replace("%s", title) : `${title} | ${site.name}`;
}

export function buildMetadata(
  site: SiteSettings,
  opts: {
    title?: string;
    description?: string;
    path?: string;
    image?: string;
    type?: "website" | "article";
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
    noIndex?: boolean;
  },
): Metadata {
  const title = buildTitle(site, opts.title);
  const description = opts.description || site.defaultDescription;
  const url = absoluteUrl(opts.path ?? "");
  const image = absoluteUrl(opts.image || site.defaultOgImage || "/seed/og-default.jpg");

  return {
    title,
    description,
    metadataBase: new URL(baseUrl()),
    alternates: { canonical: url },
    ...(opts.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: opts.type ?? "website",
      images: [{ url: image, width: 1200, height: 630, alt: opts.title || site.name }],
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
      ...(opts.modifiedTime ? { modifiedTime: opts.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ---- JSON-LD ---------------------------------------------------------------

export function personJsonLd(profile: ProfileSettings, site: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    description: site.defaultDescription,
    url: baseUrl(),
    image: absoluteUrl(profile.avatar),
    email: profile.email.replace(/^mailto:/, ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Shahabad Markanda",
      addressRegion: "Haryana",
      addressCountry: "IN",
    },
    sameAs: [profile.socials.github, profile.socials.linkedin].filter(Boolean),
    knowsAbout: [
      "Full Stack Development", "MERN Stack", "Next.js", "React Native",
      "Node.js", "MongoDB", "TypeScript", "AWS",
    ],
  };
}

export function websiteJsonLd(profile: ProfileSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${profile.name} — Full Stack Developer`,
    url: baseUrl(),
    author: { "@type": "Person", name: profile.name },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function articleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: absoluteUrl(post.ogImage || post.coverImage),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    keywords: post.tags.join(", "),
  };
}

export function projectJsonLd(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.shortDescription,
    image: absoluteUrl(project.featureImage),
    url: project.liveUrl || absoluteUrl(`/projects/${project.slug}`),
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    author: { "@type": "Person", name: "Abhishek Prajapati" },
    keywords: project.techStack.join(", "),
  };
}

/** Render JSON-LD safely inside a script tag. */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
