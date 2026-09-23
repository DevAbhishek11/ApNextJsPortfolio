"use client";

import { upload as uploadBlob } from "@vercel/blob/client";
import { useMemo, useRef, useState } from "react";
import {
  Download, FileArchive, Loader2, Package, PackagePlus, Pause, Trash2, UploadCloud,
} from "lucide-react";
import { Badge, EmptyState } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import ConfirmDialog from "./confirm-dialog";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { allowedBuildExtensions, MAX_BUILD_BYTES } from "@/lib/validation/schemas";
import type { ApiResponse, Build, BuildPlatform, Project } from "@/lib/types";

const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB — resilient for 100–150MB builds

const platformLabels: Record<BuildPlatform, string> = {
  android: "Android",
  ios: "iOS",
  web: "Web",
  other: "Other",
};

interface UploadState {
  file: File;
  progress: number; // bytes sent
  status: "uploading" | "done" | "error" | "cancelled";
  error?: string;
}

export default function BuildsManager({
  initial,
  projects,
}: {
  initial: Build[];
  projects: Project[];
}) {
  const toast = useToast();
  const [builds, setBuilds] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [platform, setPlatform] = useState<BuildPlatform>("android");
  const [projectId, setProjectId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [toDelete, setToDelete] = useState<Build | null>(null);
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<{ uploadId: string | null; cancel: boolean; controller?: AbortController }>({ uploadId: null, cancel: false });
  const inputRef = useRef<HTMLInputElement>(null);

  const fileError = useMemo(() => {
    if (!file) return null;
    const lower = file.name.toLowerCase();
    if (!allowedBuildExtensions.some((ext) => lower.endsWith(ext))) {
      return `Unsupported type. Allowed: ${allowedBuildExtensions.join(", ")}`;
    }
    if (file.size > MAX_BUILD_BYTES) return "File exceeds the 150MB build limit.";
    return null;
  }, [file]);

  const pickFile = (f: File | null) => {
    setFile(f);
    setFormError(null);
  };

  const startUpload = async () => {
    if (!file) return setFormError("Choose a build file first.");
    if (fileError) return setFormError(fileError);
    if (!version.trim()) return setFormError("Give this build a version label (e.g. 1.4.0).");
    setFormError(null);
    abortRef.current = { uploadId: null, cancel: false };
    setUpload({ file, progress: 0, status: "uploading" });

    try {
      // 1. init
      const initRes = await fetch("/api/builds/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          version: version.trim(),
          platform,
          projectId,
        }),
      });
      const initJson = (await initRes.json()) as ApiResponse<{
        uploadId: string; direct?: boolean; pathname?: string;
      }>;
      if (!initRes.ok || !initJson.success) {
        throw new Error(initJson.success ? "Could not start upload" : initJson.error.message);
      }
      const uploadId = initJson.data.uploadId;
      abortRef.current.uploadId = uploadId;

      // 2. On serverless, Vercel Blob's multipart uploader sends chunks
      // directly from the browser (with retries, no function body limit).
      // On a persistent Node server, retain the existing local chunk pipeline.
      let blobUrl: string | undefined;
      if (initJson.data.direct) {
        if (!initJson.data.pathname) throw new Error("Missing upload destination.");
        const controller = new AbortController();
        abortRef.current.controller = controller;
        const blob = await uploadBlob(initJson.data.pathname, file, {
          access: "public", multipart: true,
          handleUploadUrl: "/api/builds/blob", clientPayload: uploadId,
          abortSignal: controller.signal,
          onUploadProgress: ({ loaded }) => setUpload((u) => u ? { ...u, progress: loaded } : u),
        });
        blobUrl = blob.url;
      } else {
        const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
        let sent = 0;
        for (let i = 0; i < totalChunks; i++) {
          if (abortRef.current.cancel) throw new Error("__cancelled__");
          const blob = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          let okChunk = false;
          for (let attempt = 0; attempt < 2 && !okChunk; attempt++) {
            try {
              const res = await fetch(`/api/builds/chunk?id=${encodeURIComponent(uploadId)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/octet-stream" },
                body: blob,
              });
              if (res.ok) okChunk = true;
              else if (attempt === 1) {
                const j = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
                throw new Error(j && !j.success ? j.error.message : `Chunk ${i + 1} failed (${res.status})`);
              }
            } catch (err) {
              if (attempt === 1) throw err;
            }
          }
          sent += blob.size;
          setUpload((u) => (u ? { ...u, progress: sent } : u));
        }
      }
      if (abortRef.current.cancel) throw new Error("__cancelled__");

      // 3. Verify and register the uploaded file in the CMS.
      const finRes = await fetch("/api/builds/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, ...(blobUrl ? { blobUrl } : {}) }),
      });
      const finJson = (await finRes.json()) as ApiResponse<Build>;
      if (!finRes.ok || !finJson.success) {
        throw new Error(finJson.success ? "Finalize failed" : finJson.error.message);
      }

      setBuilds((prev) => [finJson.data, ...prev]);
      setUpload((u) => (u ? { ...u, status: "done" } : u));
      setFile(null);
      setVersion("");
      toast.success(`Build ${finJson.data.version} uploaded (${formatBytes(finJson.data.size)}).`);
      setTimeout(() => setUpload(null), 2500);
    } catch (err) {
      if (err instanceof Error && err.message === "__cancelled__") {
        setUpload(null);
        return;
      }
      const message = err instanceof Error ? err.message : "Upload failed";
      setUpload((u) => (u ? { ...u, status: "error", error: message } : u));
      toast.error(message);
      if (abortRef.current.uploadId) {
        fetch(`/api/builds/upload?id=${encodeURIComponent(abortRef.current.uploadId)}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
    }
  };

  const cancelUpload = async () => {
    abortRef.current.cancel = true;
    abortRef.current.controller?.abort();
    if (abortRef.current.uploadId) {
      await fetch(`/api/builds/upload?id=${encodeURIComponent(abortRef.current.uploadId)}`, {
        method: "DELETE",
      }).catch(() => undefined);
    }
    setUpload(null);
    toast.info("Upload cancelled.");
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await fetch(`/api/builds/${toDelete.id}`, { method: "DELETE" });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || !json.success) throw new Error(json.success ? "Delete failed" : json.error.message);
      setBuilds((prev) => prev.filter((b) => b.id !== toDelete.id));
      toast.success("Build deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setToDelete(null);
    }
  };

  const pct = upload ? Math.round((upload.progress / upload.file.size) * 100) : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
      {/* Upload form */}
      <section className="h-fit rounded-card border border-adm-border bg-adm-surface p-6 shadow-card xl:sticky xl:top-24">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-adm-text">
          <PackagePlus size={16} className="text-accent" /> Upload app build
        </h2>
        <p className="mt-1.5 text-xs leading-relaxed text-adm-faint">
          APK, AAB, IPA, ZIP (and more) up to 150MB. Uploads use retryable chunks,
          sent directly to Blob on serverless deployments.
        </p>

        <div className="mt-5 space-y-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose build file"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files[0] ?? null);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragging ? "border-accent bg-adm-accent-soft" : "border-adm-border-strong bg-adm-surface-2 hover:border-adm-faint",
            )}
          >
            <FileArchive size={22} className={file ? "text-accent" : "text-adm-faint"} />
            {file ? (
              <>
                <p className="max-w-full truncate text-xs font-semibold text-adm-text">{file.name}</p>
                <p className="text-[0.68rem] text-adm-faint">{formatBytes(file.size)}</p>
              </>
            ) : (
              <p className="text-xs text-adm-muted">
                Drop the file here or <span className="font-semibold text-accent">browse</span>
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={allowedBuildExtensions.join(",")}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>
          {fileError && <p role="alert" className="text-xs font-medium text-red-500">{fileError}</p>}

          <Field label="Version label" required htmlFor="build-version">
            <Input id="build-version" area="adm" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 1.4.0 or v2.1-beta" />
          </Field>
          <Field label="Platform" htmlFor="build-platform">
            <Select id="build-platform" area="adm" value={platform} onChange={(e) => setPlatform(e.target.value as BuildPlatform)}>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Linked project" hint="Optional" htmlFor="build-project">
            <Select id="build-project" area="adm" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>

          {formError && (
            <p role="alert" className="rounded-control border border-red-400/50 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-500">
              {formError}
            </p>
          )}

          {/* Progress / status */}
          {upload && (
            <div
              className={cn(
                "rounded-control border px-4 py-3",
                upload.status === "error"
                  ? "border-red-400/50 bg-red-500/5"
                  : upload.status === "done"
                    ? "border-emerald-400/50 bg-emerald-500/5"
                    : "border-adm-border bg-adm-surface-2",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-xs font-semibold text-adm-text">{upload.file.name}</p>
                <span className="flex items-center gap-1.5 text-xs text-adm-faint">
                  {upload.status === "uploading" && <Loader2 size={11} className="animate-spin" />}
                  {upload.status === "done" && <span className="font-semibold text-emerald-500">Complete</span>}
                  {upload.status === "error" && <span className="font-semibold text-red-500">Failed</span>}
                  {upload.status === "uploading" && `${pct}%`}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-adm-surface">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-200",
                    upload.status === "error" ? "bg-red-500" : upload.status === "done" ? "bg-emerald-500" : "bg-accent",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {upload.error && <p className="mt-2 text-xs font-medium text-red-500">{upload.error}</p>}
              {upload.status === "uploading" && (
                <button
                  onClick={() => void cancelUpload()}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-adm-muted transition-colors hover:text-red-500"
                >
                  <Pause size={11} /> Cancel upload
                </button>
              )}
            </div>
          )}

          <Button
            onClick={() => void startUpload()}
            disabled={!file || !!fileError || upload?.status === "uploading"}
            loading={upload?.status === "uploading"}
            className="w-full"
          >
            <UploadCloud size={15} />
            {upload?.status === "uploading" ? "Uploading…" : "Start upload"}
          </Button>
        </div>
      </section>

      {/* Builds list */}
      <section>
        {builds.length === 0 ? (
          <EmptyState
            adm
            icon={<Package size={22} />}
            title="No builds uploaded yet"
            description="Upload your first app build (APK, IPA, ZIP…) with the form — it'll get a public download link."
          />
        ) : (
          <div className="overflow-hidden rounded-card border border-adm-border bg-adm-surface shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-adm-border text-xs text-adm-faint">
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-3 py-3 font-medium">Version</th>
                  <th className="px-3 py-3 font-medium">Platform</th>
                  <th className="px-3 py-3 font-medium">Size</th>
                  <th className="px-3 py-3 font-medium">Uploaded</th>
                  <th className="px-3 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-adm-border">
                {builds.map((b) => {
                  const linked = projects.find((p) => p.id === b.projectId);
                  return (
                    <tr key={b.id} className="transition-colors hover:bg-adm-surface-2">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-adm-accent-soft p-2 text-accent">
                            <FileArchive size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate font-semibold text-adm-text">{b.filename}</p>
                            {linked && <p className="truncate text-[0.68rem] text-adm-faint">{linked.title}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone="accent">{b.version}</Badge>
                      </td>
                      <td className="px-3 py-3 text-xs text-adm-muted">{platformLabels[b.platform]}</td>
                      <td className="px-3 py-3 text-xs text-adm-muted">{formatBytes(b.size)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-adm-muted">
                        {formatDate(b.createdAt, { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={b.url}
                            download
                            aria-label={`Download ${b.filename}`}
                            className="rounded-lg p-2 text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-accent"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            onClick={() => setToDelete(b)}
                            aria-label={`Delete ${b.filename}`}
                            className="rounded-lg p-2 text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this build?"
        description={`“${toDelete?.filename}” (${formatBytes(toDelete?.size ?? 0)}) and its download link will be permanently removed.`}
        onConfirm={() => void doDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
