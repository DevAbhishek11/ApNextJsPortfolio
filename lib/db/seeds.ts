// Import the known seed files statically so Next.js can trace only these files
// into serverless functions. Never construct a dynamic path into the source tree:
// that causes output-file tracing to bundle the entire project.
import users from "../../data/seed/users.seed.json";
import projects from "../../data/seed/projects.seed.json";
import blog from "../../data/seed/blog.seed.json";
import media from "../../data/seed/media.seed.json";
import builds from "../../data/seed/builds.seed.json";
import messages from "../../data/seed/messages.seed.json";
import settings from "../../data/seed/settings.seed.json";
import skills from "../../data/seed/skills.seed.json";
import experience from "../../data/seed/experience.seed.json";
import education from "../../data/seed/education.seed.json";
import certifications from "../../data/seed/certifications.seed.json";

const seeds: Record<string, unknown> = {
  "users.json": users,
  "projects.json": projects,
  "blog.json": blog,
  "media.json": media,
  "builds.json": builds,
  "messages.json": messages,
  "settings.json": settings,
  "skills.json": skills,
  "experience.json": experience,
  "education.json": education,
  "certifications.json": certifications,
};

export function seedFor<T>(name: string): T {
  if (!Object.hasOwn(seeds, name)) throw new Error(`Unknown data collection: ${name}`);
  // Callers may mutate records; never mutate the imported seed singleton.
  return structuredClone(seeds[name]) as T;
}
