import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Tag } from "@/components/ui/surface";
import { formatDate, readingTime } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export default function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all duration-250 hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-2">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} className="bg-accent-soft text-accent">
              {tag}
            </Tag>
          ))}
        </div>
        <h3 className="mt-3 text-[1.05rem] font-semibold leading-snug tracking-tight text-ink transition-colors duration-150 group-hover:text-accent">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <p className="mt-4 flex items-center gap-3 text-xs text-faint">
          <span>{formatDate(post.publishedAt)}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {readingTime(post.content)} min read
          </span>
        </p>
      </div>
    </Link>
  );
}
