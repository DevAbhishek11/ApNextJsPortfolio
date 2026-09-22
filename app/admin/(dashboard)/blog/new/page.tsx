import type { Metadata } from "next";
import BlogForm from "@/components/admin/blog-form";
import { settingsRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "New Post" };

export default async function NewBlogPostPage() {
  const settings = await settingsRepo.get();
  return <BlogForm author={settings.profile.name} />;
}
