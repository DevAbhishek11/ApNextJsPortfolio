import type { Metadata } from "next";
import BuildsManager from "@/components/admin/builds-manager";
import { buildsRepo, projectsRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "App Builds" };

export default async function AdminBuildsPage() {
  const [builds, projects] = await Promise.all([buildsRepo.all(), projectsRepo.all()]);
  return <BuildsManager initial={builds} projects={projects} />;
}
