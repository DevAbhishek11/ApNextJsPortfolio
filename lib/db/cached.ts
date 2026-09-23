import { cache } from "react";
import { revalidatePath } from "next/cache";
import {
  blogRepo, certificationsRepo, educationRepo, experienceRepo,
  projectsRepo, settingsRepo, skillsRepo,
} from "./repos";

// React cache only deduplicates reads WITHIN the current render/request. A
// cross-request Next data cache can return a stale JSON seed after a write on
// another serverless instance, even though Postgres has the latest content.
export const getSettings = cache(() => settingsRepo.get());
export const getProjects = cache(() => projectsRepo.published());
export const getFeaturedProjects = cache(() => projectsRepo.featured());
export const getProjectBySlug = cache((slug: string) => projectsRepo.bySlug(slug));
export const getBlogPosts = cache(() => blogRepo.published());
export const getBlogPostBySlug = cache((slug: string) => blogRepo.bySlug(slug));
export const getSkills = cache(() => skillsRepo.all());
export const getExperience = cache(() => experienceRepo.all());
export const getCertifications = cache(() => certificationsRepo.all());
export const getEducation = cache(() => educationRepo.all());

// Route-handler mutations also invalidate any client router cache/pre-renders.
export function refreshAllContent() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
}
export const refreshProjects = refreshAllContent;
export const refreshBlog = refreshAllContent;
export const refreshSettings = refreshAllContent;
