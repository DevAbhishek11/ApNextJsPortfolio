// ---------------------------------------------------------------------------
// Shared entity types for the whole application (public site + admin CMS).
// ---------------------------------------------------------------------------

export type Status = "draft" | "published";
export type BuildPlatform = "android" | "ios" | "web" | "other";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "admin";
  tokenVersion: number;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface SiteSettings {
  name: string;
  titleTemplate: string;
  defaultDescription: string;
  defaultOgImage: string;
  analyticsId: string;
  searchConsoleId: string;
}

export interface ProfileSettings {
  name: string;
  role: string;
  tagline: string;
  roles: string[];
  bio: string;
  avatar: string;
  email: string;
  phone: string;
  location: string;
  availability: string;
  resumeUrl: string;
  socials: {
    github: string;
    linkedin: string;
    twitter: string;
    email: string;
  };
  languages: string[];
  interests: string[];
}

export interface Settings {
  site: SiteSettings;
  profile: ProfileSettings;
  theme: { adminDefault: "light" | "dark" };
}

export interface SkillItem {
  name: string;
  level: number; // 1–5
}

export interface SkillGroup {
  category: string;
  order: number;
  skills: SkillItem[];
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string; // "YYYY-MM"
  endDate: string; // "YYYY-MM" | "" when current
  current: boolean;
  summary: string;
  achievements: string[];
  order: number;
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  year: string;
  description: string;
  order: number;
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  details: string;
  order: number;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string; // sanitized HTML
  techStack: string[];
  liveUrl: string;
  secondaryLiveUrl?: string;
  githubUrl: string;
  featureImage: string;
  gallery: string[];
  keyFeatures: string[];
  challenges: string; // sanitized HTML, may be ""
  role: string;
  timeline: string;
  featured: boolean;
  status: Status;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  tags: string[];
  author: string;
  status: Status;
  publishedAt: string; // ISO date — future dates stay hidden publicly
  content: string; // sanitized HTML from the rich-text editor
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  source: "seed" | "upload";
  createdAt: string;
}

export interface Build {
  id: string;
  filename: string;
  url: string;
  version: string;
  platform: BuildPlatform;
  size: number;
  projectId: string; // "" when unlinked
  createdAt: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// API envelope ---------------------------------------------------------------

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
