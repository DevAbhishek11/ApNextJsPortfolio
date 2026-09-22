import type { Metadata } from "next";
import ProjectsTable from "@/components/admin/projects-table";
import { projectsRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const projects = await projectsRepo.all();
  return <ProjectsTable initial={projects} />;
}
