import { promises as fs } from "node:fs";
import { badRequest, handled, notFound, ok, parseBody, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { buildsRepo } from "@/lib/db/repos";
import { finalizeUpload, readUploadSession, UploadError } from "@/lib/build-uploads";
import { sniffsLikeGzip, sniffsLikeZip } from "@/lib/upload";
import { uid } from "@/lib/utils";
import { z } from "zod";
import type { Build, BuildPlatform } from "@/lib/types";

const finalizeSchema = z.object({ uploadId: z.string().min(6).max(80) });

// POST /api/builds/finalize — verify size + magic bytes, move into place,
// register in builds.json.
export async function POST(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { uploadId } = await parseBody(request, finalizeSchema);
    const session = await readUploadSession(uploadId);
    if (!session) return notFound("Upload session not found or already finalized.");

    let finalPath: string;
    let url: string;
    try {
      ({ absolutePath: finalPath, url } = await finalizeUpload(uploadId));
    } catch (err) {
      if (err instanceof UploadError) {
        if (err.code === "NOT_FOUND") return notFound(err.message);
        return badRequest(err.message);
      }
      throw err;
    }

    // Magic-byte validation of the stored file (zip-family or gzip expected).
    const head = Buffer.alloc(16);
    const fh = await fs.open(finalPath, "r");
    await fh.read(head, 0, 16, 0);
    await fh.close();
    const lower = session.originalName.toLowerCase();
    const expectsZip = [".apk", ".aab", ".ipa", ".zip", ".dmg", ".exe", ".msi"].some((e) =>
      lower.endsWith(e),
    );
    const expectsGzip = lower.endsWith(".tar.gz");
    if ((expectsZip && !sniffsLikeZip(head) && !(lower.endsWith(".exe") || lower.endsWith(".dmg"))) || (expectsGzip && !sniffsLikeGzip(head))) {
      await fs.unlink(finalPath).catch(() => undefined);
      return badRequest("File content does not match its extension — upload rejected.");
    }

    const build: Build = {
      id: uid("bld"),
      filename: session.originalName,
      url,
      version: session.version,
      platform: (["android", "ios", "web", "other"].includes(session.platform)
        ? session.platform
        : "other") as BuildPlatform,
      size: session.size,
      projectId: session.projectId,
      createdAt: new Date().toISOString(),
    };
    await buildsRepo.add(build);
    return ok(build, { status: 201 });
  });
}
