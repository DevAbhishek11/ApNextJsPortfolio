import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { badRequest, handled, unauthorized } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { assertUploadStorage } from "@/lib/blob-storage";
import { verifyBlobBuildUpload } from "@/lib/blob-builds";

// The browser uploads large builds directly with Blob's multipart uploader.
// A signed upload plan, bound to the authenticated admin, locks the pathname
// and maximum size; no serverless function receives the 150MB request body.
export async function POST(request: Request) {
  return handled(async () => {
    assertUploadStorage();
    let body: HandleUploadBody;
    try { body = (await request.json()) as HandleUploadBody; }
    catch { return badRequest("Expected a Blob upload request."); }
    if (body.type === "blob.generate-client-token" && !(await getSessionUser())) return unauthorized();

    const result = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const user = await getSessionUser();
        const plan = clientPayload && user && await verifyBlobBuildUpload(clientPayload, user.id);
        if (!plan || plan.pathname !== pathname) throw new Error("Invalid or expired build upload session.");
        return { maximumSizeInBytes: plan.size, addRandomSuffix: false };
      },
      onUploadCompleted: async () => undefined,
    });
    // Blob's client expects this raw SDK response, not our usual API envelope.
    return NextResponse.json(result);
  });
}
