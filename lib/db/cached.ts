import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import {
  blogRepo,
  certificationsRepo,
  educationRepo,
  experienceRepo,
  projectsRepo,
  settingsRepo,
  skillsRepo,
} from "./repos";

// ---------------------------------------------------------------------------
// Cached PUBLIC reads. Public pages use these so the site renders from cache,
// and every admin mutation route calls refresh*() below to invalidate the
// affected content immediately (no redeploy needed).
// ---------------------------------------------------------------------------

export const CACHE_TAGS = {
  settings: "settings",
  projects: "projects",
  blog: "blog",
  skills: "skills",
  experience: "experience",
  certifications: "certifications",
  education: "education",
} as const;

export const getSettings = unstable_cache(
  () => settingsRepo.get(),
  ["settings"],
  { tags: [CACHE_TAGS.settings] },
);

export const getProjects = unstable_cache(
  () => projectsRepo.published(),
  ["projects-published"],
  { tags: [CACHE_TAGS.projects] },
);

export const getFeaturedProjects = unstable_cache(
  () => projectsRepo.featured(),
  ["projects-featured"],
  { tags: [CACHE_TAGS.projects] },
);

export const getProjectBySlug = unstable_cache(
  (slug: string) => projectsRepo.bySlug(slug),
  ["project-by-slug"],
  { tags: [CACHE_TAGS.projects] },
);

export const getBlogPosts = unstable_cache(
  () => blogRepo.published(),
  ["blog-published"],
  { tags: [CACHE_TAGS.blog] },
);

export const getBlogPostBySlug = unstable_cache(
  (slug: string) => blogRepo.bySlug(slug),
  ["blog-by-slug"],
  { tags: [CACHE_TAGS.blog] },
);

export const getSkills = unstable_cache(
  () => skillsRepo.all(),
  ["skills"],
  { tags: [CACHE_TAGS.skills] },
);

export const getExperience = unstable_cache(
  () => experienceRepo.all(),
  ["experience"],
  { tags: [CACHE_TAGS.experience] },
);

export const getCertifications = unstable_cache(
  () => certificationsRepo.all(),
  ["certifications"],
  { tags: [CACHE_TAGS.certifications] },
);

export const getEducation = unstable_cache(
  () => educationRepo.all(),
  ["education"],
  { tags: [CACHE_TAGS.education] },
);

// ---- Invalidation helpers (call from admin API routes only) ------------------

export function refreshProjects() {
  revalidateTag(CACHE_TAGS.projects, { expire: 0 });
}

export function refreshBlog() {
  revalidateTag(CACHE_TAGS.blog, { expire: 0 });
}

export function refreshSettings() {
  revalidateTag(CACHE_TAGS.settings, { expire: 0 });
}

export function refreshAllContent() {
  Object.values(CACHE_TAGS).forEach((tag) => revalidateTag(tag, { expire: 0 }));
}
