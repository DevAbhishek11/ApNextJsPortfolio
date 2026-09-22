import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schemas shared by the admin UI (client-side) and the API (server-side).
// ---------------------------------------------------------------------------

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Must be a full URL starting with http(s)://")
  .optional()
  .default("");

const htmlField = (max: number, label: string) =>
  z.string().max(max, `${label} is too long (max ${max.toLocaleString()} characters)`);

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(140),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  shortDescription: z.string().trim().min(10, "Add a short description (min 10 chars)").max(320),
  description: htmlField(200_000, "Description"),
  techStack: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  liveUrl: optionalUrl,
  secondaryLiveUrl: optionalUrl,
  githubUrl: optionalUrl,
  featureImage: z.string().trim().min(1, "Feature image is required").max(500),
  gallery: z.array(z.string().max(500)).max(24).default([]),
  keyFeatures: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
  challenges: htmlField(100_000, "Challenges").default(""),
  role: z.string().trim().max(120).default(""),
  timeline: z.string().trim().max(60).default(""),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().int().min(0).max(999).default(0),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const blogSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(180),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only"),
  excerpt: z.string().trim().min(10, "Add an excerpt (min 10 chars)").max(400),
  coverImage: z.string().trim().min(1, "Cover image is required").max(500),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  author: z.string().trim().min(1).max(120).default("Abhishek Prajapati"),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Publish date must be a valid date"),
  content: htmlField(500_000, "Content"),
  metaTitle: z.string().trim().max(200).default(""),
  metaDescription: z.string().trim().max(320).default(""),
  ogImage: z.string().trim().max(500).default(""),
  canonicalUrl: z.string().trim().max(500).default(""),
});
export type BlogInput = z.infer<typeof blogSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z
    .string()
    .trim()
    .min(3, "Please enter your email")
    .max(200)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Please enter a valid email address"),
  subject: z.string().trim().min(2, "Please add a subject").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
  // Honeypot — must stay empty (bots fill it).
  website: z.string().max(0).optional().or(z.literal("")),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(3, "Email is required").max(200),
  password: z.string().min(1, "Password is required").max(200),
  remember: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const settingsSchema = z.object({
  site: z.object({
    name: z.string().trim().min(1).max(120),
    titleTemplate: z.string().trim().max(160).default(""),
    defaultDescription: z.string().trim().max(320).default(""),
    defaultOgImage: z.string().trim().max(500).default(""),
    analyticsId: z.string().trim().max(60).default(""),
    searchConsoleId: z.string().trim().max(120).default(""),
  }),
  profile: z.object({
    name: z.string().trim().min(1).max(120),
    role: z.string().trim().max(120).default(""),
    tagline: z.string().trim().max(200).default(""),
    roles: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
    bio: z.string().trim().max(10000).default(""),
    avatar: z.string().trim().max(500).default(""),
    email: z.string().trim().max(200).default(""),
    phone: z.string().trim().max(60).default(""),
    location: z.string().trim().max(200).default(""),
    availability: z.string().trim().max(200).default(""),
    resumeUrl: z.string().trim().max(500).default(""),
    socials: z.object({
      github: z.string().trim().max(300).default(""),
      linkedin: z.string().trim().max(300).default(""),
      twitter: z.string().trim().max(300).default(""),
      email: z.string().trim().max(300).default(""),
    }),
    languages: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
    interests: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  }),
  theme: z.object({
    adminDefault: z.enum(["light", "dark"]).default("dark"),
  }),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(200),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(100)
    .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), "Include at least one letter and one number"),
  confirmPassword: z.string().min(1, "Please confirm the new password").max(100),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const buildInitSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  size: z
    .number()
    .int()
    .positive()
    .max(150 * 1024 * 1024, "Builds are limited to 150MB"),
  version: z.string().trim().min(1, "Version label is required").max(60),
  platform: z.enum(["android", "ios", "web", "other"]).default("other"),
  projectId: z.string().trim().max(80).default(""),
});
export type BuildInitInput = z.infer<typeof buildInitSchema>;

export const allowedBuildExtensions = [".apk", ".aab", ".ipa", ".zip", ".tar.gz", ".dmg", ".exe", ".msi"];

export const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/svg+xml": ["svg"],
};

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12MB
export const MAX_BUILD_BYTES = 150 * 1024 * 1024; // 150MB
