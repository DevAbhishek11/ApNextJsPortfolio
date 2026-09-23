import { del, head } from "@vercel/blob";
import { IS_SERVERLESS, StorageConfigurationError, paths } from "./db/store";
import { promises as fs } from "node:fs";
import path from "node:path";

export function directBuildUploads(): boolean {
  return IS_SERVERLESS || Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function assertUploadStorage(): void {
  if (IS_SERVERLESS && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new StorageConfigurationError(
      "Persistent file storage is not configured. Connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN) and redeploy. Uploads cannot be saved to serverless /tmp.",
    );
  }
}

export function isBlobUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(parsed.hostname);
  } catch { return false; }
}

/** Look up an object in OUR blob store, never fetch a client-supplied URL. */
export async function verifiedBlob(url: string, prefix: "media/" | "builds/") {
  if (!isBlobUrl(url)) return null;
  try {
    const blob = await head(url);
    return blob.pathname.startsWith(prefix) && blob.url === new URL(url).origin + new URL(url).pathname
      ? blob : null;
  } catch { return null; }
}

/** Delete only files in our storage namespace. Never delete a seed asset. */
export async function deleteStoredUpload(url: string, kind: "media" | "builds"): Promise<void> {
  if (isBlobUrl(url)) {
    const blob = await verifiedBlob(url, `${kind}/`);
    if (blob) await del(blob.url);
    return;
  }
  if (!new RegExp(`^/uploads/${kind}/[a-zA-Z0-9_.~-]+$`).test(url) || url.includes("..")) return;
  await fs.unlink(path.join(paths.uploads, kind, path.basename(url))).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
}
