"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toast";
import TagInput from "./tag-input";
import ImageInput from "./image-input";
import MediaPicker from "./media-picker";
import { projectSchema, type ProjectInput } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";
import type { ApiResponse, Project } from "@/lib/types";

function GalleryManager({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...value];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {value.map((url, i) => (
          <div
            key={url + i}
            className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-adm-border bg-adm-surface-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            <img src={url} alt={`Gallery image ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/70 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-0.5 text-white">
                <GripVertical size={11} className="opacity-60" />
                <button type="button" aria-label="Move left" className="p-0.5 hover:text-accent" onClick={() => move(i, -1)}>
                  <ArrowUp size={13} className="rotate-[-90deg]" />
                </button>
                <button type="button" aria-label="Move right" className="p-0.5 hover:text-accent" onClick={() => move(i, 1)}>
                  <ArrowDown size={13} className="rotate-[-90deg]" />
                </button>
              </span>
              <button
                type="button"
                aria-label={`Remove image ${i + 1}`}
                className="p-0.5 text-white hover:text-red-400"
                onClick={() => onChange(value.filter((_, x) => x !== i))}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <span className="absolute left-1.5 top-1.5 rounded bg-ink/70 px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
              {i + 1}
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-adm-border-strong bg-adm-surface-2 text-adm-faint transition-colors hover:border-accent hover:text-accent"
        >
          <ImagePlus size={18} />
          <span className="text-[0.68rem] font-medium">Add image</span>
        </button>
      </div>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange([...value, url])}
      />
    </div>
  );
}

function KeyFeaturesEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const clean = draft.trim();
    if (!clean || value.length >= 20) return setDraft("");
    onChange([...value, clean]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {value.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <Input
              area="adm"
              value={item}
              onChange={(e) => onChange(value.map((v, x) => (x === i ? e.target.value : v)))}
              aria-label={`Key feature ${i + 1}`}
            />
            <button
              type="button"
              aria-label={`Remove feature ${i + 1}`}
              onClick={() => onChange(value.filter((_, x) => x !== i))}
              className="shrink-0 rounded-lg p-2 text-adm-faint transition-colors hover:bg-adm-surface-2 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Input
          area="adm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a key feature…"
          aria-label="New key feature"
        />
        <Button type="button" variant="adm" size="sm" onClick={add} disabled={!draft.trim()}>
          <Plus size={13} /> Add
        </Button>
      </div>
    </div>
  );
}

export default function ProjectForm({ initial }: { initial?: Project }) {
  const router = useRouter();
  const toast = useToast();
  const slugTouched = useRef(!!initial);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof projectSchema>, undefined, ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          slug: initial.slug,
          shortDescription: initial.shortDescription,
          description: initial.description,
          techStack: initial.techStack,
          liveUrl: initial.liveUrl,
          secondaryLiveUrl: initial.secondaryLiveUrl ?? "",
          githubUrl: initial.githubUrl,
          featureImage: initial.featureImage,
          gallery: initial.gallery,
          keyFeatures: initial.keyFeatures,
          challenges: initial.challenges,
          role: initial.role,
          timeline: initial.timeline,
          featured: initial.featured,
          status: initial.status,
          order: initial.order,
        }
      : {
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          techStack: [],
          liveUrl: "",
          secondaryLiveUrl: "",
          githubUrl: "",
          featureImage: "",
          gallery: [],
          keyFeatures: [],
          challenges: "",
          role: "",
          timeline: "",
          featured: false,
          status: "draft",
          order: 0,
        },
  });

  const featured = watch("featured");

  const onSubmit = async (values: ProjectInput) => {
    try {
      const res = await fetch(initial ? `/api/projects/${initial.id}` : "/api/projects", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as ApiResponse<Project>;
      if (!res.ok || !json.success) {
        if (!json.success && json.error.fields) {
          const first = Object.entries(json.error.fields)[0];
          toast.error(`${first[0]}: ${first[1]}`);
        } else {
          toast.error(json.success ? "Save failed." : json.error.message);
        }
        return;
      }
      toast.success(initial ? "Project updated." : "Project created.");
      router.push("/admin/projects");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    }
  };

  const wrapSubmit = handleSubmit(onSubmit, (errors) => {
    const first = Object.values(errors)[0];
    toast.error(first?.message?.toString() ?? "Please fix the highlighted fields.");
  });

  return (
    <form onSubmit={wrapSubmit} noValidate className="grid gap-5 xl:grid-cols-[1fr_360px]">
      {/* Main column */}
      <div className="space-y-5">
        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Basics</h2>
          <div className="space-y-4">
            <Field label="Title" required error={errors.title?.message} htmlFor="pf-title">
              <Input
                id="pf-title"
                area="adm"
                invalid={!!errors.title}
                placeholder="e.g. Invoice System"
                {...register("title", {
                  onChange: (e) => {
                    if (!slugTouched.current) {
                      setValue("slug", slugify(e.target.value), { shouldValidate: false });
                    }
                  },
                })}
              />
            </Field>
            <Field label="Slug" required error={errors.slug?.message} hint="URL: /projects/your-slug" htmlFor="pf-slug">
              <Input
                id="pf-slug"
                area="adm"
                invalid={!!errors.slug}
                placeholder="invoice-system"
                {...register("slug", { onChange: () => (slugTouched.current = true) })}
              />
            </Field>
            <Field label="Short description" required error={errors.shortDescription?.message} hint="Shown on cards and in search results." htmlFor="pf-short">
              <Textarea
                id="pf-short"
                area="adm"
                rows={3}
                invalid={!!errors.shortDescription}
                placeholder="One or two sentences on what it is and who it's for."
                {...register("shortDescription")}
              />
            </Field>
            <Field
              label="Long description"
              error={errors.description?.message}
              hint="HTML allowed (paragraphs, lists, headings) — sanitized on save."
              htmlFor="pf-desc"
            >
              <Textarea
                id="pf-desc"
                area="adm"
                rows={9}
                invalid={!!errors.description}
                placeholder="<p>Tell the full story: what it does, architecture, outcomes…</p>"
                {...register("description")}
              />
            </Field>
            <Field label="Challenges & solutions" error={errors.challenges?.message} hint="Optional — shown as its own section." htmlFor="pf-challenges">
              <Textarea
                id="pf-challenges"
                area="adm"
                rows={5}
                invalid={!!errors.challenges}
                placeholder="<p>What was hard and how you solved it…</p>"
                {...register("challenges")}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Key features</h2>
          <Controller
            control={control}
            name="keyFeatures"
            render={({ field }) => <KeyFeaturesEditor value={field.value ?? []} onChange={field.onChange} />}
          />
        </section>

        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Gallery</h2>
          <Controller
            control={control}
            name="gallery"
            render={({ field }) => <GalleryManager value={field.value ?? []} onChange={field.onChange} />}
          />
          <p className="mt-3 text-xs text-adm-faint">
            Order matters — drag with the arrows. The first image is also reused as a secondary hero shot.
          </p>
        </section>
      </div>

      {/* Side column */}
      <div className="space-y-5">
        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Publishing</h2>
          <div className="space-y-4">
            <Field label="Status" htmlFor="pf-status">
              <Select id="pf-status" area="adm" {...register("status")}>
                <option value="draft">Draft (hidden publicly)</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field label="Order" hint="Lower numbers appear first." htmlFor="pf-order">
              <Input
                id="pf-order"
                area="adm"
                type="number"
                min={0}
                {...register("order", { valueAsNumber: true })}
              />
            </Field>
            <div className="flex items-center justify-between rounded-control border border-adm-border bg-adm-surface-2 px-3.5 py-3">
              <div>
                <p className="text-sm font-semibold text-adm-text">Featured on homepage</p>
                <p className="text-xs text-adm-faint">Shown in the home spotlight section.</p>
              </div>
              <Switch
                checked={featured ?? false}
                onChange={(next) => setValue("featured", next)}
                label="Featured on homepage"
                id="pf-featured"
              />
            </div>
          </div>
        </section>

        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Feature image</h2>
          <Controller
            control={control}
            name="featureImage"
            render={({ field }) => (
              <div>
                <ImageInput value={field.value} onChange={field.onChange} label="Pick the card/hero image" />
                {errors.featureImage && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.featureImage.message}
                  </p>
                )}
              </div>
            )}
          />
        </section>

        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Details</h2>
          <div className="space-y-4">
            <Field label="Tech stack" error={errors.techStack?.message}>
              <Controller
                control={control}
                name="techStack"
                render={({ field }) => (
                  <TagInput value={field.value ?? []} onChange={field.onChange} placeholder="Next.js, Node.js…" />
                )}
              />
            </Field>
            <Field label="Your role" hint="e.g. Full Stack Developer" htmlFor="pf-role">
              <Input id="pf-role" area="adm" placeholder="Full Stack Developer" {...register("role")} />
            </Field>
            <Field label="Timeline" hint="e.g. 2024 – 2025" htmlFor="pf-timeline">
              <Input id="pf-timeline" area="adm" placeholder="2024 – 2025" {...register("timeline")} />
            </Field>
            <Field label="Live URL" error={errors.liveUrl?.message} htmlFor="pf-live">
              <Input id="pf-live" area="adm" type="url" invalid={!!errors.liveUrl} placeholder="https://…" {...register("liveUrl")} />
            </Field>
            <Field label="Secondary live URL" error={errors.secondaryLiveUrl?.message} htmlFor="pf-live2">
              <Input id="pf-live2" area="adm" type="url" invalid={!!errors.secondaryLiveUrl} placeholder="https://…" {...register("secondaryLiveUrl")} />
            </Field>
            <Field label="GitHub URL" error={errors.githubUrl?.message} htmlFor="pf-github">
              <Input id="pf-github" area="adm" type="url" invalid={!!errors.githubUrl} placeholder="https://github.com/…" {...register("githubUrl")} />
            </Field>
          </div>
        </section>

        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting} className="flex-1">
            {initial ? "Save changes" : "Create project"}
          </Button>
          <Button type="button" variant="adm" onClick={() => router.push("/admin/projects")}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
