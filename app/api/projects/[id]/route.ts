import { badRequest, handled, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { projectsRepo } from "@/lib/db/repos";
import { refreshProjects } from "@/lib/db/cached";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { projectSchema } from "@/lib/validation/schemas";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const { id } = await params;
    const user = await getSessionUser();
    const project = await projectsRepo.byId(id);
    if (!project) return notFound("Project not found.");
    if (project.status !== "published" && !user) return notFound("Project not found.");
    return ok(project);
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;

    const existing = await projectsRepo.byId(id);
    if (!existing) return notFound("Project not found.");

    const input = await parseBody(request, projectSchema.partial());

    if (input.slug && input.slug !== existing.slug) {
      const clash = await projectsRepo.bySlug(input.slug);
      if (clash && clash.id !== id) {
        return badRequest("A project with this slug already exists.", { slug: "Slug already in use" });
      }
    }

    const patch = {
      ...input,
      ...(input.description !== undefined
        ? { description: sanitizeRichHtml(input.description) }
        : {}),
      ...(input.challenges !== undefined
        ? { challenges: sanitizeRichHtml(input.challenges) }
        : {}),
    };

    const updated = await projectsRepo.update(id, patch);
    refreshProjects();
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const removed = await projectsRepo.remove(id);
    if (!removed) return notFound("Project not found.");
    refreshProjects();
    return ok({ deleted: true });
  });
}
