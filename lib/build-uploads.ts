import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureDir, paths } from "@/lib/db/store";

// ---------------------------------------------------------------------------
// Chunked build-upload session store.
//
// Large build files (100–150MB) are uploaded in ~8MB chunks:
//   1. POST /api/builds/init     → creates .meta.json + empty .part
//   2. PUT  /api/builds/chunk    → appends chunk bytes (validated order/size)
//   3. POST /api/builds/finalize → magic-byte check, move into /public/uploads
//   4. DELETE /api/builds/upload → cancel + cleanup
//
// Sessions older than UPLOAD_TTL_MS are swept as abandoned.
// ---------------------------------------------------------------------------

export const UPLOAD_TTL_MS = 6 * 60 * 60 * 1000; // 6h
export const MAX_CHUNK_BYTES = 12 * 1024 * 1024; // hard ceiling per chunk (~8MB expected)

export interface UploadSession {
  id: string;
  filename: string; // sanitized storage filename
  originalName: string;
  size: number; // expected total bytes
  received: number; // bytes written so far
  chunks: number; // chunks written so far
  version: string;
  platform: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

function metaPath(id: string): string {
  return path.join(paths.tmpDir, `${id}.meta.json`);
}

function partPath(id: string): string {
  return path.join(paths.tmpDir, `${id}.part`);
}

function sanitizeId(id: string): string | null {
  return /^[a-zA-Z0-9_-]{6,64}$/.test(id) ? id : null;
}

export async function createUploadSession(
  session: Omit<UploadSession, "received" | "chunks" | "createdAt" | "updatedAt">,
): Promise<UploadSession> {
  const id = sanitizeId(session.id);
  if (!id) throw new Error("invalid upload id");
  await ensureDir(paths.tmpDir);
  await sweepAbandonedUploads();
  const full: UploadSession = {
    ...session,
    id,
    received: 0,
    chunks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(metaPath(id), JSON.stringify(full, null, 2), "utf8");
  await fs.writeFile(partPath(id), Buffer.alloc(0));
  return full;
}

export async function readUploadSession(id: string): Promise<UploadSession | null> {
  const safe = sanitizeId(id);
  if (!safe) return null;
  try {
    const meta = JSON.parse(await fs.readFile(metaPath(safe), "utf8")) as UploadSession;
    // Cross-check the .part file size against the meta record.
    const stat = await fs.stat(partPath(safe)).catch(() => null);
    if (!stat) return null;
    meta.received = stat.size;
    return meta;
  } catch {
    return null;
  }
}

export async function appendUploadChunk(
  id: string,
  chunk: Buffer,
): Promise<UploadSession> {
  const session = await readUploadSession(id);
  if (!session) throw new UploadError("NOT_FOUND", "Unknown or expired upload session.");
  if (chunk.length > MAX_CHUNK_BYTES) {
    throw new UploadError("CHUNK_TOO_LARGE", "Chunk exceeds the 12MB per-chunk limit.");
  }
  if (session.received + chunk.length > session.size) {
    throw new UploadError(
      "TOO_MANY_BYTES",
      "Upload would exceed the declared file size.",
    );
  }
  await fs.appendFile(partPath(id), chunk);
  const next: UploadSession = {
    ...session,
    received: session.received + chunk.length,
    chunks: session.chunks + 1,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(metaPath(id), JSON.stringify(next, null, 2), "utf8");
  return next;
}

/** Moves the completed .part file to the builds directory; returns its public URL. */
export async function finalizeUpload(id: string): Promise<{ absolutePath: string; url: string }> {
  const session = await readUploadSession(id);
  if (!session) throw new UploadError("NOT_FOUND", "Unknown or expired upload session.");
  if (session.received !== session.size) {
    throw new UploadError(
      "INCOMPLETE",
      `Upload incomplete (${session.received}/${session.size} bytes).`,
    );
  }
  await ensureDir(paths.buildUploads);
  const absolutePath = path.join(paths.buildUploads, session.filename);
  const url = `/uploads/builds/${session.filename}`;
  await fs.rename(partPath(id), absolutePath);
  await fs.unlink(metaPath(id)).catch(() => undefined);
  return { absolutePath, url };
}

export async function cancelUpload(id: string): Promise<void> {
  const safe = sanitizeId(id);
  if (!safe) return;
  await fs.unlink(partPath(safe)).catch(() => undefined);
  await fs.unlink(metaPath(safe)).catch(() => undefined);
}

export async function sweepAbandonedUploads(): Promise<void> {
  try {
    await ensureDir(paths.tmpDir);
    const files = await fs.readdir(paths.tmpDir);
    const cutoff = Date.now() - UPLOAD_TTL_MS;
    for (const file of files) {
      const full = path.join(paths.tmpDir, file);
      try {
        const stat = await fs.stat(full);
        if (stat.mtimeMs < cutoff) await fs.unlink(full);
      } catch {
        /* ignore individual sweep errors */
      }
    }
  } catch {
    /* tmp dir missing yet — fine */
  }
}

export class UploadError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}
