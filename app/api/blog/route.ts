import { badRequest, handled, ok, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { blogRepo } from "@/lib/db/repos";
import { refreshBlog } from "@/lib/db/cached";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { blogSchema } from "@/lib/validation/schemas";
import { uid } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

export async function GET() {
  return handled(async () => {
    const user = await getSessionUser();
    const items = user ? await blogRepo.all() : await blogRepo.published();
    return ok(items);
  });
}

export async function POST(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const input = await parseBody(request, blogSchema);

    const existing = await blogRepo.bySlug(input.slug);
    if (existing) {
      return badRequest("A post with this slug already exists.", { slug: "Slug already in use" });
    }

    const post: BlogPost = {
      id: uid("post"),
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt,
      coverImage: input.coverImage,
      tags: input.tags,
      author: input.author,
      status: input.status,
      publishedAt: new Date(input.publishedAt).toISOString(),
      content: sanitizeRichHtml(input.content),
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      ogImage: input.ogImage,
      canonicalUrl: input.canonicalUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await blogRepo.create(post);
    refreshBlog();
    return ok(post, { status: 201 });
  });
}
