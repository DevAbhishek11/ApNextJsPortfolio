import type { Metadata } from "next";
import MediaLibrary from "@/components/admin/media-library";
import { mediaRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Media Library" };

export default async function AdminMediaPage() {
  const media = await mediaRepo.all();
  return <MediaLibrary initial={media} />;
}
