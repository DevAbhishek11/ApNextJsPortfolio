import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";

// ---------------------------------------------------------------------------
// Runtime uploads handler — serves files created by the CMS at runtime
// (media library assets, chunked app builds) from public/uploads.
//
// Why this exists: with `output: "standalone"` (Docker deploys), the public/
// directory is indexed once at build time — files written afterwards are
// invisible to the built-in static handler (404). This route streams them
// from disk instead. Filenames under uploads/ are content-hashed, so
// immutable caching is safe.
// ---------------------------------------------------------------------------

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  webm: "video/webm",
  mp4: "video/mp4",
  pdf: "application/pdf",
  zip: "application/zip",
  apk: "application/vnd.android.package-archive",
  ipa: "application/octet-stream",
};

// Binary downloads are offered as attachments (app builds, archives).
const ATTACHMENT_EXT = new Set(["zip", "apk", "ipa"]);

function safeResolve(segments: string[]): string | null {
  if (segments.length === 0) return null;
  const root = path.resolve(process.cwd(), "public", "uploads");
  const decoded: string[] = [];
  for (const s of segments) {
    let d: string;
    try {
      d = decodeURIComponent(s);
    } catch {
      return null;
    }
    // Reject traversal, empty parts, hidden files and Windows separators.
    if (!d || d.includes("..") || d.includes("\\") || d.includes("\0") || d.startsWith(".")) return null;
    if (!/^[\w.~-]+$/.test(d)) return null;
    decoded.push(d);
  }
  const full = path.resolve(root, ...decoded);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  return full;
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await params;
    const full = safeResolve(segments ?? []);
    if (!full) return new NextResponse(null, { status: 404 });

    let stat;
    try {
      stat = await fs.stat(full);
    } catch {
      return new NextResponse(null, { status: 404 });
    }
    if (!stat.isFile() || stat.size === 0) return new NextResponse(null, { status: 404 });

    const ext = path.extname(full).slice(1).toLowerCase();
    const headers = new Headers({
      "content-type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "content-length": String(stat.size),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    });
    if (ATTACHMENT_EXT.has(ext)) {
      headers.set(
        "content-disposition",
        `attachment; filename="${encodeURIComponent(path.basename(full))}"`,
      );
    }
    if (ext === "svg") {
      // Uploaded SVGs are sanitized at write time; still avoid inline execution.
      headers.set("content-security-policy", "script-src 'none'");
    }

    const stream = Readable.toWeb(createReadStream(full)) as ReadableStream;
    return new NextResponse(stream, { status: 200, headers });
  } catch (err) {
    console.error("[uploads] serve failed:", err);
    return new NextResponse(null, { status: 500 });
  }
}

export async function HEAD(request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const res = await GET(request, ctx as never);
  return new NextResponse(null, { status: res.status, headers: res.headers });
}
