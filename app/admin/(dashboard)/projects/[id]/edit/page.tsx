import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/project-form";
import { projectsRepo } from "@/lib/db/repos";

export const metadata: Metadata = { title: "Edit Project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await projectsRepo.byId(id);
  if (!project) notFound();
  return <ProjectForm initial={project} />;
}
