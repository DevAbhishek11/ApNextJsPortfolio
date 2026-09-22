import { ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { SectionHeading } from "./section-heading";
import { RevealGroup } from "@/components/animation/reveal";
import { ButtonLink } from "@/components/ui/button";
import BlogCard from "@/components/blog/blog-card";
import type { BlogPost } from "@/lib/types";

export default function LatestPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;
  return (
    <Section className="bg-surface-2/50">
      <Container>
        <SectionHeading
          eyebrow="Writing"
          title="Latest from the blog"
          description="Practical notes on full-stack architecture, real-time systems, and shipping polished UIs."
        />
        <RevealGroup className="grid gap-5 md:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </RevealGroup>
        <div className="mt-12 text-center">
          <ButtonLink href="/blog" variant="secondary">
            Read all articles <ArrowRight size={15} />
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
