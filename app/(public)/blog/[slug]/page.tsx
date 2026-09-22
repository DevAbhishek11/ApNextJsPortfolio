import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Reveal, RevealGroup } from "@/components/animation/reveal";
import { ReadingProgress } from "@/components/animation/parallax";
import { Tag } from "@/components/ui/surface";
import BlogCard from "@/components/blog/blog-card";
import { CodeHighlighter, ShareButtons, TableOfContents } from "@/components/blog/blog-tools";
import { getBlogPostBySlug, getBlogPosts, getSettings } from "@/lib/db/cached";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd, jsonLdScript } from "@/lib/seo";
import { extractToc, formatDate, readingTime, stripHtml } from "@/lib/utils";

// Detail pages render on demand so CMS-driven deletes/yet-unseen slugs
// return a *real* 404 status (ISR + notFound() can serve a 200 soft-404).
export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getBlogPostBySlug(slug), getSettings()]);
  if (!post) return { title: "Post not found" };
  return buildMetadata(settings.site, {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: post.canonicalUrl || `/blog/${post.slug}`,
    image: post.ogImage || post.coverImage,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    tags: post.tags,
  });
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, all, settings] = await Promise.all([
    getBlogPostBySlug(slug),
    getBlogPosts(),
    getSettings(),
  ]);
  if (!post || post.status !== "published") notFound();

  const { content, toc } = extractToc(post.content);
  const minutes = readingTime(post.content);
  const related = all
    .filter((p) => p.id !== post.id && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, 3);
  const fallbackRelated = all.filter((p) => p.id !== post.id).slice(0, 3);
  const relatedFinal = related.length > 0 ? related : fallbackRelated;

  return (
    <>
      <ReadingProgress />
      <CodeHighlighter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            articleJsonLd(post),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Blog", url: "/blog" },
              { name: post.title, url: `/blog/${post.slug}` },
            ]),
          ]),
        }}
      />

      <article>
        <section className="relative overflow-hidden border-b border-border pt-16">
          <div className="hero-grid" aria-hidden />
          <Container className="relative pb-12 pt-14 sm:pt-16">
            <Reveal variant="fade">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"
              >
                <ArrowLeft size={15} /> All articles
              </Link>
            </Reveal>
            <Reveal variant="rise" delay={0.05}>
              <div className="mt-6 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <Tag key={tag} className="bg-accent-soft text-accent">
                    {tag}
                  </Tag>
                ))}
              </div>
            </Reveal>
            <Reveal variant="rise" delay={0.1}>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-[2.6rem]">
                {post.title}
              </h1>
            </Reveal>
            <Reveal variant="rise" delay={0.15}>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
                <span className="flex items-center gap-2 font-medium text-ink">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[0.65rem] font-bold text-accent-ink">
                    {post.author
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  {post.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} /> {minutes} min read
                </span>
              </div>
            </Reveal>
          </Container>
        </section>

        <Section>
          <Container>
            <Reveal variant="scale">
              <figure className="relative aspect-[16/7] overflow-hidden rounded-[1.25rem] border border-border bg-surface-2 shadow-card">
                <Image
                  src={post.coverImage}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1280px) 100vw, 1200px"
                  className="object-cover"
                />
              </figure>
            </Reveal>

            <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_260px]">
              <div className="min-w-0">
                <Reveal variant="rise">
                  <div className="richtext" dangerouslySetInnerHTML={{ __html: content }} />
                </Reveal>

                <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                  <p className="text-sm font-medium text-muted">Enjoyed this? Share it.</p>
                  <ShareButtons title={post.title} text={stripHtml(post.excerpt)} />
                </div>

                <div className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2">
                      {settings.profile.avatar ? (
                        <Image
                          src={settings.profile.avatar}
                          alt={post.author}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="bg-accent px-3 py-2 text-sm font-bold text-accent-ink">
                          AP
                        </span>
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{post.author}</p>
                      <p className="text-sm text-faint">{settings.profile.role}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        Fullstack dev writing about what actually works in production — architecture,
                        performance, and the craft of shipping.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {toc.length > 1 && (
                <aside className="no-print hidden lg:block">
                  <div className="sticky top-24">
                    <TableOfContents toc={toc} />
                  </div>
                </aside>
              )}
            </div>
          </Container>
        </Section>

        {relatedFinal.length > 0 && (
          <Section className="border-t border-border bg-surface-2/40">
            <Container>
              <div className="mb-10 flex items-end justify-between gap-4">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">Keep reading</h2>
                <Link
                  href="/blog"
                  className="hidden items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-hover sm:inline-flex"
                >
                  All articles <ArrowRight size={14} />
                </Link>
              </div>
              <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedFinal.map((p) => (
                  <BlogCard key={p.id} post={p} />
                ))}
              </RevealGroup>
            </Container>
          </Section>
        )}
      </article>
    </>
  );
}

// Ensure non-existent slugs return a hard 404 (no soft-404s)
export const dynamicParams = true;
