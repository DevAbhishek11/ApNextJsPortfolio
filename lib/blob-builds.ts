import { head } from "@vercel/blob";
import { SignJWT, jwtVerify } from "jose";
import { sessionSecret } from "@/lib/auth/session";
import { buildsRepo } from "@/lib/db/repos";
import { assertUploadStorage, deleteStoredUpload, isBlobUrl } from "@/lib/blob-storage";
import { hasAllowedBuildExtension, safeFilename, sniffsLikeGzip, sniffsLikeZip } from "@/lib/upload";
import { uid } from "@/lib/utils";
import type { Build, BuildPlatform } from "@/lib/types";
import type { BuildInitInput } from "@/lib/validation/schemas";

const ISSUER = "ap-portfolio-build-upload";
const MAX_AGE = "6h";

export interface BuildUploadPlan {
  pathname: string;
  filename: string;
  size: number;
  version: string;
  platform: BuildPlatform;
  projectId: string;
  owner: string;
}

export async function createBlobBuildUpload(input: BuildInitInput, owner: string) {
  assertUploadStorage();
  const plan: BuildUploadPlan = {
    pathname: `builds/${safeFilename(input.filename)}`,
    filename: input.filename,
    size: input.size,
    version: input.version,
    platform: input.platform,
    projectId: input.projectId,
    owner,
  };
  const uploadId = await new SignJWT({ plan })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(MAX_AGE)
    .sign(sessionSecret());
  return { direct: true, uploadId, pathname: plan.pathname, received: 0 };
}

export async function verifyBlobBuildUpload(token: string, owner: string): Promise<BuildUploadPlan | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { issuer: ISSUER });
    const plan = payload.plan as BuildUploadPlan | undefined;
    if (!plan || plan.owner !== owner || !plan.pathname.startsWith("builds/") ||
        !hasAllowedBuildExtension(plan.filename) || plan.size <= 0 || plan.size > 150 * 1024 * 1024) return null;
    return plan;
  } catch { return null; }
}

export class BlobBuildError extends Error {}

/** Verify an uploaded object in our store before making it a downloadable build. */
export async function finalizeBlobBuild(plan: BuildUploadPlan, url: string): Promise<Build> {
  assertUploadStorage();
  if (!isBlobUrl(url)) throw new BlobBuildError("Not an uploaded build URL.");
  let blob;
  try { blob = await head(url); }
  catch { throw new BlobBuildError("Uploaded build not found."); }
  if (blob.pathname !== plan.pathname || blob.size !== plan.size ||
      blob.url !== new URL(url).origin + new URL(url).pathname) {
    throw new BlobBuildError("Uploaded build doesn't match the upload session.");
  }
  const existing = (await buildsRepo.all()).find((b) => b.url === blob.downloadUrl);
  if (existing) return existing; // retry after a lost finalize response

  // CDN supports Range. Refuse a full response for large files so the server
  // never downloads a 150MB binary just to read its magic bytes.
  const res = await fetch(blob.url, { headers: { Range: "bytes=0-15" }, cache: "no-store" });
  if (!res.ok || (res.status !== 206 && blob.size > 64)) {
    throw new BlobBuildError("Couldn't verify the uploaded build bytes.");
  }
  const headBytes = Buffer.from(await res.arrayBuffer());
  const lower = plan.filename.toLowerCase();
  const zip = [".apk", ".aab", ".ipa", ".zip", ".msi"].some((e) => lower.endsWith(e));
  const valid = zip ? sniffsLikeZip(headBytes) : lower.endsWith(".tar.gz")
    ? sniffsLikeGzip(headBytes) : lower.endsWith(".exe")
      ? headBytes[0] === 0x4d && headBytes[1] === 0x5a : true; // .dmg: trailer format
  if (!valid) {
    await deleteStoredUpload(blob.url, "builds");
    throw new BlobBuildError("File contents do not match the selected build type.");
  }
  const build: Build = {
    id: uid("build"), filename: plan.filename,
    url: blob.downloadUrl, version: plan.version, platform: plan.platform,
    size: blob.size, projectId: plan.projectId, createdAt: new Date().toISOString(),
  };
  await buildsRepo.add(build);
  return build;
}
