import type { Metadata } from "next";
import BlogTable from "@/components/admin/blog-table";
import { blogRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Blog" };

export default async function AdminBlogPage() {
  const posts = await blogRepo.all();
  return <BlogTable initial={posts} />;
}
