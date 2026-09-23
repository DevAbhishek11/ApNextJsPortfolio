import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { badRequest, handled, ok, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { IS_SERVERLESS } from "@/lib/db/store";
import { assertUploadStorage } from "@/lib/blob-storage";
import { MAX_IMAGE_BYTES } from "@/lib/validation/schemas";

const types: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp",
};

// The dashboard uses direct uploads only above Vercel's 4.5MB function body
// limit. Smaller images (and safe SVGs) still use POST /api/media.
export async function GET() {
  return handled(async () => {
    if (!(await getSessionUser())) return unauthorized();
    assertUploadStorage();
    return ok({ direct: IS_SERVERLESS });
  });
}

export async function POST(request: Request) {
  return handled(async () => {
    assertUploadStorage();
    let body: HandleUploadBody;
    try { body = (await request.json()) as HandleUploadBody; }
    catch { return badRequest("Expected a Blob upload request."); }
    if (body.type === "blob.generate-client-token" && !(await getSessionUser())) return unauthorized();

    const result = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname) => {
        const ext = /^media\/[a-f0-9-]{30,40}\.(png|jpe?g|gif|webp)$/.exec(pathname)?.[1];
        if (!ext) throw new Error("Only PNG, JPEG, GIF and WEBP dashboard uploads are permitted.");
        return {
          allowedContentTypes: [types[ext]],
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: false, // the client already supplies a random UUID
        };
      },
      // The SDK verifies Blob's completion notification. Registration occurs
      // separately after the browser receives the URL (no unauthenticated DB write).
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(result);
  });
}
