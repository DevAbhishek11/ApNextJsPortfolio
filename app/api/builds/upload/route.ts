import { handled, ok, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { cancelUpload, readUploadSession } from "@/lib/build-uploads";
import { directBuildUploads } from "@/lib/blob-storage";

// GET /api/builds/upload?id=<id>  → resume hint ({received} bytes so far)
export async function GET(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (directBuildUploads()) return ok({ received: 0, active: false });
    const session = await readUploadSession(id);
    return ok({ received: session?.received ?? 0, active: !!session });
  });
}

// DELETE /api/builds/upload?id=<id> → cancel an in-progress upload
export async function DELETE(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!directBuildUploads()) await cancelUpload(id);
    return ok({ cancelled: true });
  });
}
