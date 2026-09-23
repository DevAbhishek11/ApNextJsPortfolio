import { handled, ok, payloadTooLarge, unauthorized, badRequest } from "@/lib/api";
import { IS_SERVERLESS } from "@/lib/db/store";
import { assertUploadStorage, deleteStoredUpload } from "@/lib/blob-storage";
import { getSessionUser } from "@/lib/auth/guard";
import { mediaRepo } from "@/lib/db/repos";
import { isAllowedImage, isSafeSvg, saveMediaBuffer, sniffImageMime } from "@/lib/upload";
import { MAX_IMAGE_BYTES } from "@/lib/validation/schemas";
import { uid } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

export async function GET() {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok(await mediaRepo.all());
  });
}

/**
 * POST /api/media — admin, multipart form-data with one or more `files`.
 * Type is verified by sniffing magic bytes — never by the client-supplied
 * MIME or extension. SVGs are scanned for script content.
 */
export async function POST(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    assertUploadStorage();

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return badRequest("Expected multipart/form-data with a 'files' field.");
    }

    const files = form
      .getAll("files")
      .filter((f): f is File => typeof f === "object" && f !== null && "arrayBuffer" in f);

    if (files.length === 0) return badRequest("No files provided.");
    if (files.length > 10) return badRequest("Upload at most 10 files at once.");

    const saved: MediaItem[] = [];
    const errors: { name: string; message: string }[] = [];

    for (const file of files) {
      try {
        if (file.size > MAX_IMAGE_BYTES) {
          errors.push({ name: file.name, message: "File exceeds the 12MB image limit." });
          continue;
        }
        if (IS_SERVERLESS && file.size > 4 * 1024 * 1024) {
          errors.push({ name: file.name, message: "Files over 4MB must use the dashboard's direct-to-Blob upload." });
          continue;
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const mime = sniffImageMime(buffer);
        if (!isAllowedImage(mime)) {
          errors.push({ name: file.name, message: "Unsupported or tampered image type." });
          continue;
        }
        if (mime === "image/svg+xml" && !isSafeSvg(buffer)) {
          errors.push({ name: file.name, message: "SVG contains disallowed active content." });
          continue;
        }
        const stored = await saveMediaBuffer(buffer, mime);
        const item: MediaItem = {
          id: uid("med"),
          filename: file.name,
          url: stored.url,
          mimeType: mime,
          size: file.size,
          source: "upload",
          createdAt: new Date().toISOString(),
        };
        await mediaRepo.add(item);
        saved.push(item);
      } catch (err) {
        console.error("[media] upload failed:", err);
        errors.push({ name: file.name, message: "Failed to store file." });
      }
    }

    if (saved.length === 0) {
      const first = errors[0];
      if (first && (first.message.includes("limit") || first.message.includes("over 4MB"))) return payloadTooLarge(first.message);
      return badRequest(first ? first.message : "Upload failed.", first ? { file: first.message } : undefined);
    }
    return ok({ items: saved, errors }, { status: 201 });
  });
}

export async function DELETE(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const body = (await request.json().catch(() => ({}))) as { id?: string };
    if (!body.id) return badRequest("Missing media id.");
    const removed = await mediaRepo.remove(body.id);
    if (!removed) return badRequest("Media item not found.");
    if (removed.source === "upload") {
      await deleteStoredUpload(removed.url, "media").catch((err) =>
        console.error("[media] stored file cleanup failed:", err),
      );
    }
    return ok({ deleted: true });
  });
}
