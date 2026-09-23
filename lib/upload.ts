import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureDir, paths } from "@/lib/db/store";
import { put } from "@vercel/blob";
import { assertUploadStorage } from "@/lib/blob-storage";
import { ALLOWED_IMAGE_TYPES, allowedBuildExtensions } from "@/lib/validation/schemas";

// ---------------------------------------------------------------------------
// Upload helpers: magic-byte sniffing (NEVER trust file extensions), safe
// filenames, and storage under /public/uploads.
// ---------------------------------------------------------------------------

export function sniffImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 8) {
    // PNG
    if (
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    )
      return "image/png";
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
    // GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
    // WEBP (RIFF....WEBP)
    if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    )
      return "image/webp";
  }
  // SVG — detect XML start
  const head = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "image/svg+xml";
  return null;
}

export function isAllowedImage(mime: string | null): mime is string {
  return !!mime && mime in ALLOWED_IMAGE_TYPES;
}

export function isSafeSvg(buffer: Buffer): boolean {
  const text = buffer.toString("utf8");
  // SVG can execute script via event handlers, links, foreignObject, CSS and
  // XML entities. Accept only simple, self-contained artwork.
  return !/<(?:script|foreignobject|iframe|object|embed|style|image|use|animate|set)\b|\bon[a-z]+\s*=|(?:href|src)\s*=|@import|url\s*\(|<!doctype|<!entity|<\?xml/i.test(text);
}

/** Zip-based formats (.zip, .apk, .aab, .ipa) start with PK\x03\x04. */
export function sniffsLikeZip(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x50 && buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)
  );
}

export function sniffsLikeGzip(buffer: Buffer): boolean {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
}

export function hasAllowedBuildExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return allowedBuildExtensions.some((ext) => lower.endsWith(ext));
}

/** Sanitize a user-supplied filename into a safe storage name. */
export function safeFilename(original: string): string {
  const base = path.basename(original).replace(/[^a-zA-Z0-9._-]+/g, "-");
  const cleaned = base.replace(/^\.+/, "").slice(0, 120) || "file";
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${cleaned}`;
}

export function mimeToExt(mime: string): string {
  const exts = ALLOWED_IMAGE_TYPES[mime];
  return exts ? exts[0] : "bin";
}

export interface StoredUpload {
  url: string;
}

export async function saveMediaBuffer(buffer: Buffer, mime: string): Promise<StoredUpload> {
  assertUploadStorage();
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.${mimeToExt(mime)}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`media/${name}`, buffer, {
      access: "public", contentType: mime, addRandomSuffix: false,
    });
    return { url: blob.url };
  }
  await ensureDir(paths.mediaUploads);
  await fs.writeFile(path.join(paths.mediaUploads, name), buffer);
  return { url: `/uploads/media/${name}` };
}
