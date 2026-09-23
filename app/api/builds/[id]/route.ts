import { handled, notFound, ok, unauthorized } from "@/lib/api";
import { deleteStoredUpload } from "@/lib/blob-storage";
import { getSessionUser } from "@/lib/auth/guard";
import { buildsRepo } from "@/lib/db/repos";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    const removed = await buildsRepo.remove(id);
    if (!removed) return notFound("Build not found.");
    await deleteStoredUpload(removed.url, "builds").catch((err) =>
      console.error("[builds] stored file cleanup failed:", err),
    );
    return ok({ deleted: true });
  });
}
