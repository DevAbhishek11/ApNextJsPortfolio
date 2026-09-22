import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Newspaper, Search } from "lucide-react";
import PageHeader from "@/components/sections/page-header";
import CTABanner from "@/components/sections/cta-banner";
import BlogCard from "@/components/blog/blog-card";
import { Container, Section } from "@/components/ui/container";
import { RevealGroup } from "@/components/animation/reveal";
import { EmptyState } from "@/components/ui/surface";
import { getBlogPosts, getSettings } from "@/lib/db/cached";
import { buildMetadata, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildMetadata(settings.site, {
    title: "Blog",
    description:
      "Engineering notes on full-stack architecture, Socket.io real-time systems, Next.js performance, and design-to-code workflows.",
    path: "/blog",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; page?: string }>;
}) {
  const [{ tag, q, page }, posts, settings] = await Promise.all([
    searchParams,
    getBlogPosts(),
    getSettings(),
  ]);

  const activeTag = (tag ?? "").trim();
  const query = (q ?? "").trim().toLowerCase();
  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  const tags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();

  const filtered = posts.filter((p) => {
    if (activeTag && !p.tags.includes(activeTag)) return false;
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.excerpt.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagePosts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const buildHref = (pageNum: number) => {
    const params = new URLSearchParams();
    if (activeTag) params.set("tag", activeTag);
    if (query) params.set("q", (q ?? "").trim());
    if (pageNum > 1) params.set("page", String(pageNum));
    const qs = params.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
            ]),
          ),
        }}
      />
      <PageHeader
        eyebrow="Blog"
        title="Notes from the production floor"
        description="What actually worked — real-time scaling, Next.js performance, and design-to-code workflows that cut revision cycles in half."
      />

      <Section>
        <Container>
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form action="/blog" method="get" className="lg:max-w-sm lg:flex-1">
              {activeTag && <input type="hidden" name="tag" value={activeTag} />}
              <label className="flex h-11 w-full items-center gap-2.5 rounded-control border border-border bg-surface px-4">
                <Search size={16} className="shrink-0 text-faint" />
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search articles…"
                  aria-label="Search articles"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
                />
              </label>
            </form>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by tag">
              <Link
                href="/blog"
                aria-current={!activeTag ? "true" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  !activeTag
                    ? "border-accent bg-accent text-accent-ink shadow-sm"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-ink",
                )}
              >
                All
              </Link>
              {tags.map((t) => (
                <Link
                  key={t}
                  href={`/blog?tag=${encodeURIComponent(t)}`}
                  aria-current={activeTag === t ? "true" : undefined}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                    activeTag === t
                      ? "border-accent bg-accent text-accent-ink shadow-sm"
                      : "border-border bg-surface text-muted hover:border-border-strong hover:text-ink",
                  )}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>

          {pagePosts.length === 0 ? (
            <EmptyState
              icon={<Newspaper size={22} />}
              title="No articles found"
              description="Try a different search or clear the tag filter."
            />
          ) : (
            <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pagePosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </RevealGroup>
          )}

          {totalPages > 1 && (
            <nav
              className="mt-12 flex items-center justify-center gap-2"
              aria-label="Blog pagination"
            >
              <Link
                href={buildHref(Math.max(1, safePage - 1))}
                aria-disabled={safePage <= 1}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-muted transition-colors",
                  safePage <= 1 && "pointer-events-none opacity-40",
                )}
              >
                <ChevronLeft size={16} />
              </Link>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link
                  key={i}
                  href={buildHref(i + 1)}
                  aria-current={safePage === i + 1 ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 min-w-9 items-center justify-center rounded-control border px-2 text-sm font-medium transition-colors",
                    safePage === i + 1
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-border bg-surface text-muted hover:text-ink",
                  )}
                >
                  {i + 1}
                </Link>
              ))}
              <Link
                href={buildHref(Math.min(totalPages, safePage + 1))}
                aria-disabled={safePage >= totalPages}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-control border border-border bg-surface text-muted transition-colors",
                  safePage >= totalPages && "pointer-events-none opacity-40",
                )}
              >
                <ChevronRight size={16} />
              </Link>
            </nav>
          )}
        </Container>
      </Section>

      <CTABanner email={settings.profile.email} />
    </>
  );
}
