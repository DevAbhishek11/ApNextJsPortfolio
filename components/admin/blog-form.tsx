"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import TagInput from "./tag-input";
import ImageInput from "./image-input";
import { blogSchema, type BlogInput } from "@/lib/validation/schemas";
import { slugify } from "@/lib/utils";
import type { ApiResponse, BlogPost } from "@/lib/types";

// Tiptap is heavy and admin-only — code-split it out of any page bundle.
const BlogEditor = dynamic(() => import("./blog-editor"), {
  ssr: false,
  loading: () => (
    <div className="animate-skeleton h-[480px] rounded-control border border-adm-border bg-adm-surface-2" />
  ),
});

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BlogForm({ initial, author }: { initial?: BlogPost; author: string }) {
  const router = useRouter();
  const toast = useToast();
  const slugTouched = useRef(!!initial);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof blogSchema>, undefined, BlogInput>({
    resolver: zodResolver(blogSchema),
    defaultValues: initial
      ? {
          title: initial.title,
          slug: initial.slug,
          excerpt: initial.excerpt,
          coverImage: initial.coverImage,
          tags: initial.tags,
          author: initial.author,
          status: initial.status,
          publishedAt: toLocalInputValue(initial.publishedAt),
          content: initial.content,
          metaTitle: initial.metaTitle,
          metaDescription: initial.metaDescription,
          ogImage: initial.ogImage,
          canonicalUrl: initial.canonicalUrl,
        }
      : {
          title: "",
          slug: "",
          excerpt: "",
          coverImage: "",
          tags: [],
          author,
          status: "draft",
          publishedAt: toLocalInputValue(new Date().toISOString()),
          content: "",
          metaTitle: "",
          metaDescription: "",
          ogImage: "",
          canonicalUrl: "",
        },
  });

  const onSubmit = async (values: BlogInput) => {
    try {
      const res = await fetch(initial ? `/api/blog/${initial.id}` : "/api/blog", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, publishedAt: new Date(values.publishedAt).toISOString() }),
      });
      const json = (await res.json()) as ApiResponse<BlogPost>;
      if (!res.ok || !json.success) {
        if (!json.success && json.error.fields) {
          const first = Object.entries(json.error.fields)[0];
          toast.error(`${first[0]}: ${first[1]}`);
        } else {
          toast.error(json.success ? "Save failed." : json.error.message);
        }
        return;
      }
      toast.success(initial ? "Post updated." : "Post created.");
      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    }
  };

  const wrapSubmit = handleSubmit(onSubmit, (errs) => {
    const first = Object.values(errs)[0];
    toast.error(first?.message?.toString() ?? "Please fix the highlighted fields.");
  });

  const previewSlug = getValues("slug");

  return (
    <form onSubmit={wrapSubmit} noValidate className="grid gap-5 xl:grid-cols-[1fr_360px]">
      {/* Main column */}
      <div className="space-y-5">
        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <div className="space-y-4">
            <Field label="Title" required error={errors.title?.message} htmlFor="bf-title">
              <Input
                id="bf-title"
                area="adm"
                invalid={!!errors.title}
                placeholder="A title worth clicking"
                {...register("title", {
                  onChange: (e) => {
                    if (!slugTouched.current) {
                      setValue("slug", slugify(e.target.value), { shouldValidate: false });
                    }
                  },
                })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug" required error={errors.slug?.message} hint="URL: /blog/your-slug" htmlFor="bf-slug">
                <Input
                  id="bf-slug"
                  area="adm"
                  invalid={!!errors.slug}
                  {...register("slug", { onChange: () => (slugTouched.current = true) })}
                />
              </Field>
              <Field label="Author" error={errors.author?.message} htmlFor="bf-author">
                <Input id="bf-author" area="adm" {...register("author")} />
              </Field>
            </div>
            <Field label="Excerpt" required error={errors.excerpt?.message} hint="Shown on cards and as the default meta description." htmlFor="bf-excerpt">
              <Textarea
                id="bf-excerpt"
                area="adm"
                rows={3}
                invalid={!!errors.excerpt}
                placeholder="One paragraph that sells the article."
                {...register("excerpt")}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-adm-text">Content</h2>
            {initial && initial.status === "published" && previewSlug && (
              <a
                href={`/blog/${previewSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-accent-hover"
              >
                Preview live <ExternalLink size={12} />
              </a>
            )}
          </div>
          <Controller
            control={control}
            name="content"
            render={({ field }) => <BlogEditor value={field.value} onChange={field.onChange} />}
          />
          {errors.content && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
              {errors.content.message}
            </p>
          )}
        </section>
      </div>

      {/* Side column */}
      <div className="space-y-5">
        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Publishing</h2>
          <div className="space-y-4">
            <Field label="Status" htmlFor="bf-status">
              <Select id="bf-status" area="adm" {...register("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </Field>
            <Field
              label="Publish date"
              error={errors.publishedAt?.message}
              hint="Future dates schedule the post — it stays hidden until then."
              htmlFor="bf-publishedAt"
            >
              <Input id="bf-publishedAt" area="adm" type="datetime-local" {...register("publishedAt")} />
            </Field>
            <Field label="Tags" error={errors.tags?.message}>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagInput value={field.value ?? []} onChange={field.onChange} max={10} placeholder="Next.js, Real-Time…" />
                )}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">Cover image</h2>
          <Controller
            control={control}
            name="coverImage"
            render={({ field }) => (
              <div>
                <ImageInput value={field.value} onChange={field.onChange} label="Pick the cover image" />
                {errors.coverImage && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-500">
                    {errors.coverImage.message}
                  </p>
                )}
              </div>
            )}
          />
        </section>

        <section className="rounded-card border border-adm-border bg-adm-surface p-6 shadow-card">
          <h2 className="mb-5 text-sm font-semibold text-adm-text">SEO</h2>
          <div className="space-y-4">
            <Field label="Meta title" hint="Defaults to the post title." htmlFor="bf-metaTitle">
              <Input id="bf-metaTitle" area="adm" placeholder="Custom SEO title…" {...register("metaTitle")} />
            </Field>
            <Field label="Meta description" hint="Defaults to the excerpt." htmlFor="bf-metaDesc">
              <Textarea id="bf-metaDesc" area="adm" rows={3} placeholder="Custom SEO description…" {...register("metaDescription")} />
            </Field>
            <Field label="OG image URL" hint="Defaults to the cover image." htmlFor="bf-ogImage">
              <Input id="bf-ogImage" area="adm" placeholder="/uploads/… or https://…" {...register("ogImage")} />
            </Field>
            <Field label="Canonical URL" hint="Only if republishing from elsewhere." htmlFor="bf-canonical">
              <Input id="bf-canonical" area="adm" placeholder="https://…" {...register("canonicalUrl")} />
            </Field>
          </div>
        </section>

        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting} className="flex-1">
            {initial ? "Save changes" : "Create post"}
          </Button>
          <Button type="button" variant="adm" onClick={() => router.push("/admin/blog")}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
