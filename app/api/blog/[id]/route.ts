import { badRequest, handled, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { blogRepo } from "@/lib/db/repos";
import { refreshBlog } from "@/lib/db/cached";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { blogSchema } from "@/lib/validation/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const { id } = await params;
    const user = await getSessionUser();
    const post = await blogRepo.byId(id);
    if (!post) return notFound("Post not found.");
    const visible = post.status === "published" && new Date(post.publishedAt).getTime() <= Date.now();
    if (!visible && !user) return notFound("Post not found.");
    return ok(post);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await blogRepo.byId(id);
    if (!existing) return notFound("Post not found.");

    const input = await parseBody(request, blogSchema.partial());

    if (input.slug && input.slug !== existing.slug) {
      const clash = await blogRepo.bySlug(input.slug);
      if (clash && clash.id !== id) {
        return badRequest("A post with this slug already exists.", { slug: "Slug already in use" });
      }
    }

    const patch = {
      ...input,
      ...(input.content !== undefined ? { content: sanitizeRichHtml(input.content) } : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: new Date(input.publishedAt).toISOString() }
        : {}),
    };

    const updated = await blogRepo.update(id, patch);
    refreshBlog();
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const removed = await blogRepo.remove(id);
    if (!removed) return notFound("Post not found.");
    refreshBlog();
    return ok({ deleted: true });
  });
}
