import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogForm from "@/components/admin/blog-form";
import { blogRepo, settingsRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Edit Post" };

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, settings] = await Promise.all([blogRepo.byId(id), settingsRepo.get()]);
  if (!post) notFound();
  return <BlogForm initial={post} author={settings.profile.name} />;
}
