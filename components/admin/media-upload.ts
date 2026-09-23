"use client";

import { upload } from "@vercel/blob/client";
import type { ApiResponse, MediaItem } from "@/lib/types";
import { MAX_IMAGE_BYTES } from "@/lib/validation/schemas";

const SERVER_BODY_LIMIT = 4 * 1024 * 1024;
const types: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", webp: "image/webp",
};

async function register(url: string, filename: string): Promise<MediaItem> {
  const res = await fetch("/api/media/blob/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, filename }),
  });
  const json = (await res.json()) as ApiResponse<{ items: MediaItem[] }>;
  if (!res.ok || !json.success) throw new Error(json.success ? "Could not save image" : json.error.message);
  return json.data.items[0];
}

function uploadThroughServer(file: File, onProgress?: (pct: number) => void): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media");
    const form = new FormData();
    form.append("files", file);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as ApiResponse<{ items: MediaItem[]; errors: { message: string }[] }>;
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          if (json.data.items[0]) resolve(json.data.items[0]);
          else reject(new Error(json.data.errors[0]?.message ?? "Upload rejected"));
        } else reject(new Error(json.success ? "Upload failed" : json.error.message));
      } catch (err) { reject(err instanceof Error ? err : new Error("Unexpected server response.")); }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}

/** Shared by the media library and image pickers. Large serverless uploads
 * bypass the Vercel function body limit, then are verified and registered. */
export async function uploadMedia(file: File, onProgress?: (pct: number) => void): Promise<MediaItem> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("File exceeds the 12MB image limit.");
  const config = await fetch("/api/media/blob", { cache: "no-store" });
  const mode = (await config.json()) as ApiResponse<{ direct: boolean }>;
  if (!config.ok || !mode.success) throw new Error(mode.success ? "Upload unavailable" : mode.error.message);

  if (!mode.data.direct || file.size <= SERVER_BODY_LIMIT) return uploadThroughServer(file, onProgress);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!types[ext]) throw new Error("Direct upload supports PNG, JPEG, GIF and WEBP (SVG must be under 4MB).");
  const blob = await upload(`media/${crypto.randomUUID()}.${ext}`, file, {
    access: "public",
    contentType: types[ext],
    handleUploadUrl: "/api/media/blob",
    onUploadProgress: ({ percentage }) => onProgress?.(Math.round(percentage)),
  });
  return register(blob.url, file.name);
}
