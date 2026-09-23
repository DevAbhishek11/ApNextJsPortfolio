import { badRequest, handled, ok, payloadTooLarge, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { hasAllowedBuildExtension, safeFilename } from "@/lib/upload";
import { createUploadSession } from "@/lib/build-uploads";
import { createBlobBuildUpload } from "@/lib/blob-builds";
import { directBuildUploads } from "@/lib/blob-storage";
import { buildInitSchema, MAX_BUILD_BYTES } from "@/lib/validation/schemas";
import { uid } from "@/lib/utils";

// POST /api/builds/init — declare a build upload; session id + metadata.
export async function POST(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const input = await parseBody(request, buildInitSchema);

    if (!hasAllowedBuildExtension(input.filename)) {
      return badRequest("Unsupported file type. Allowed: .apk, .aab, .ipa, .zip, .tar.gz, .dmg, .exe, .msi", {
        file: "Unsupported file extension",
      });
    }
    if (input.size > MAX_BUILD_BYTES) {
      return payloadTooLarge("Build files are limited to 150MB.");
    }

    if (directBuildUploads()) {
      return ok(await createBlobBuildUpload(input, user.id), { status: 201 });
    }

    const session = await createUploadSession({
      id: uid("upl").replace("upl_", ""),
      filename: safeFilename(input.filename),
      originalName: input.filename,
      size: input.size,
      version: input.version,
      platform: input.platform,
      projectId: input.projectId,
    });

    return ok({ uploadId: session.id, received: session.received }, { status: 201 });
  });
}
