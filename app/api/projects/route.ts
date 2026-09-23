import { conflict, handled, ok, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { projectsRepo } from "@/lib/db/repos";
import { refreshProjects } from "@/lib/db/cached";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { projectSchema } from "@/lib/validation/schemas";
import { parseBody } from "@/lib/api";
import { uid } from "@/lib/utils";
import type { Project } from "@/lib/types";

// GET /api/projects — public: published only. Admins get everything (+drafts).
export async function GET(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    const items = user ? await projectsRepo.all() : await projectsRepo.published();
    const url = new URL(request.url);
    if (url.searchParams.get("featured") === "true" && !user) {
      return ok(items.filter((p) => p.featured));
    }
    return ok(items);
  });
}

// POST /api/projects — admin only.
export async function POST(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const input = await parseBody(request, projectSchema);

    const existing = await projectsRepo.bySlug(input.slug);
    if (existing) return conflict("A project with this slug already exists.", { slug: "Slug already in use" });

    const project: Project = {
      id: uid("prj"),
      slug: input.slug,
      title: input.title,
      shortDescription: input.shortDescription,
      description: sanitizeRichHtml(input.description),
      techStack: input.techStack,
      liveUrl: input.liveUrl ?? "",
      secondaryLiveUrl: input.secondaryLiveUrl ?? "",
      githubUrl: input.githubUrl ?? "",
      featureImage: input.featureImage,
      gallery: input.gallery,
      keyFeatures: input.keyFeatures,
      challenges: sanitizeRichHtml(input.challenges ?? ""),
      role: input.role,
      timeline: input.timeline,
      featured: input.featured,
      status: input.status,
      order: input.order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await projectsRepo.create(project);
    refreshProjects();
    return ok(project, { status: 201 });
  });
}
