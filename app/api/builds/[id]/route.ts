import { promises as fs } from "node:fs";
import path from "node:path";
import { handled, notFound, ok, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { buildsRepo } from "@/lib/db/repos";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const removed = await buildsRepo.remove(id);
    if (!removed) return notFound("Build not found.");
    if (removed.url.startsWith("/uploads/")) {
      await fs
        .unlink(path.join(process.cwd(), "public", removed.url))
        .catch(() => undefined);
    }
    return ok({ deleted: true });
  });
}
