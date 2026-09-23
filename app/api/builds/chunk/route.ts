import { badRequest, conflict, handled, notFound, ok, payloadTooLarge, unauthorized } from "@/lib/api";
import { directBuildUploads } from "@/lib/blob-storage";
import { getSessionUser } from "@/lib/auth/guard";
import { appendUploadChunk, UploadError } from "@/lib/build-uploads";

// PUT /api/builds/chunk?id=<uploadId> — raw chunk body (application/octet-stream).
export async function PUT(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (directBuildUploads()) return conflict("Use direct-to-Blob upload for builds on this deployment.");

    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id) return badRequest("Missing upload id.");

    let buffer: Buffer;
    try {
      buffer = Buffer.from(await request.arrayBuffer());
    } catch {
      return badRequest("Expected raw chunk bytes in the request body.");
    }
    if (buffer.length === 0) return badRequest("Empty chunk.");

    try {
      const session = await appendUploadChunk(id, buffer);
      return ok({
        received: session.received,
        chunks: session.chunks,
        complete: session.received === session.size,
      });
    } catch (err) {
      if (err instanceof UploadError) {
        if (err.code === "NOT_FOUND") return notFound(err.message);
        if (err.code === "CHUNK_TOO_LARGE" || err.code === "TOO_MANY_BYTES")
          return payloadTooLarge(err.message);
        return badRequest(err.message);
      }
      throw err;
    }
  });
}
