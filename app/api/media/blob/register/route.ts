import { z } from "zod";
import { badRequest, handled, ok, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { mediaRepo } from "@/lib/db/repos";
import { assertUploadStorage, deleteStoredUpload, verifiedBlob } from "@/lib/blob-storage";
import { isAllowedImage, sniffImageMime } from "@/lib/upload";
import { MAX_IMAGE_BYTES } from "@/lib/validation/schemas";
import { uid } from "@/lib/utils";
import type { MediaItem } from "@/lib/types";

const schema = z.object({ url: z.string().url().max(1000), filename: z.string().trim().min(1).max(255) });

// Complete a direct browser→Blob upload. Check the blob in OUR store and its
// actual bytes before registering it. Never trust a client-provided URL/MIME.
export async function POST(request: Request) {
  return handled(async () => {
    if (!(await getSessionUser())) return unauthorized();
    assertUploadStorage();
    const { url, filename } = await parseBody(request, schema);
    const info = await verifiedBlob(url, "media/");
    if (!info) return badRequest("Uploaded file was not found in this site's media store.");
    if (!info.size || info.size > MAX_IMAGE_BYTES) {
      await deleteStoredUpload(info.url, "media");
      return badRequest("Image exceeds the 12MB limit.");
    }
    const existing = (await mediaRepo.all()).find((m) => m.url === info.url);
    if (existing) return ok({ items: [existing], errors: [] });

    const res = await fetch(info.url, { cache: "no-store" });
    if (!res.ok) throw new Error("Unable to verify the uploaded image.");
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = sniffImageMime(buffer);
    if (!isAllowedImage(mime) || mime === "image/svg+xml" || mime !== info.contentType || buffer.length !== info.size) {
      await deleteStoredUpload(info.url, "media");
      return badRequest("Image contents do not match the allowed file type.");
    }
    const item: MediaItem = {
      id: uid("med"), filename, url: info.url, mimeType: mime,
      size: info.size, source: "upload", createdAt: new Date().toISOString(),
    };
    await mediaRepo.add(item);
    return ok({ items: [item], errors: [] }, { status: 201 });
  });
}
