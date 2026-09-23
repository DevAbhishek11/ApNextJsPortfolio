import { readJson, updateJson, writeJson } from "./store";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type {
  BlogPost,
  Build,
  Certification,
  EducationEntry,
  ExperienceEntry,
  MediaItem,
  Message,
  Project,
  Settings,
  SkillGroup,
  User,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Typed repositories — the ONLY code allowed to touch the JSON files.
// Public site reads come from here (wrapped with cache in cached.ts), and all
// admin mutations go through these functions plus updateJson transactions.
// Composite indexes / foreign keys don't exist — filter in memory; the data
// set (dozens of records) is trivially small.
// ---------------------------------------------------------------------------

const now = () => new Date().toISOString();

// ---- Users ----------------------------------------------------------------

export const usersRepo = {
  async all(): Promise<User[]> {
    return readJson<User[]>("users.json", []);
  },
  async findByEmail(email: string): Promise<User | null> {
    const users = await this.all();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
  async findById(id: string): Promise<User | null> {
    const users = await this.all();
    return users.find((u) => u.id === id) ?? null;
  },
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    let changed = false;
    // Verify inside the serialized/CAS transaction, not against an earlier
    // read: two simultaneous changes must not both accept the old password.
    await updateJson<User[]>("users.json", [], async (users) => {
      const user = users.find((u) => u.id === id);
      if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
        changed = false;
        return users;
      }
      const passwordHash = await hashPassword(newPassword);
      changed = true;
      return users.map((u) => u.id === id ? {
        ...u, passwordHash,
        tokenVersion: (u.tokenVersion ?? 1) + 1, // kills every existing session
      } : u);
    });
    return changed;
  },
};

// ---- Projects ---------------------------------------------------------------

export const projectsRepo = {
  async all(): Promise<Project[]> {
    const items = await readJson<Project[]>("projects.json", []);
    return [...items].sort((a, b) => a.order - b.order);
  },
  async published(): Promise<Project[]> {
    return (await this.all()).filter((p) => p.status === "published");
  },
  async featured(): Promise<Project[]> {
    return (await this.published()).filter((p) => p.featured).slice(0, 4);
  },
  async byId(id: string): Promise<Project | null> {
    return (await this.all()).find((p) => p.id === id) ?? null;
  },
  async bySlug(slug: string): Promise<Project | null> {
    return (await this.all()).find((p) => p.slug === slug) ?? null;
  },
  async create(project: Project): Promise<Project> {
    await updateJson<Project[]>("projects.json", [], (items) => [
      ...items,
      { ...project, createdAt: now(), updatedAt: now() },
    ]);
    return project;
  },
  async update(id: string, patch: Partial<Project>): Promise<Project | null> {
    let updated: Project | null = null;
    await updateJson<Project[]>("projects.json", [], (items) =>
      items.map((p) => {
        if (p.id !== id) return p;
        updated = { ...p, ...patch, id, updatedAt: now() };
        return updated;
      }),
    );
    return updated;
  },
  async remove(id: string): Promise<boolean> {
    let found = false;
    await updateJson<Project[]>("projects.json", [], (items) =>
      items.filter((p) => {
        if (p.id === id) found = true;
        return p.id !== id;
      }),
    );
    return found;
  },
};

// ---- Blog ------------------------------------------------------------------

function visible(post: BlogPost): boolean {
  return post.status === "published" && new Date(post.publishedAt).getTime() <= Date.now();
}

export const blogRepo = {
  async all(): Promise<BlogPost[]> {
    const items = await readJson<BlogPost[]>("blog.json", []);
    return [...items].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  },
  async published(): Promise<BlogPost[]> {
    return (await this.all()).filter(visible);
  },
  async byId(id: string): Promise<BlogPost | null> {
    return (await this.all()).find((p) => p.id === id) ?? null;
  },
  async bySlug(slug: string): Promise<BlogPost | null> {
    return (await this.all()).find((p) => p.slug === slug) ?? null;
  },
  async create(post: BlogPost): Promise<BlogPost> {
    await updateJson<BlogPost[]>("blog.json", [], (items) => [
      { ...post, createdAt: now(), updatedAt: now() },
      ...items,
    ]);
    return post;
  },
  async update(id: string, patch: Partial<BlogPost>): Promise<BlogPost | null> {
    let updated: BlogPost | null = null;
    await updateJson<BlogPost[]>("blog.json", [], (items) =>
      items.map((p) => {
        if (p.id !== id) return p;
        updated = { ...p, ...patch, id, updatedAt: now() };
        return updated;
      }),
    );
    return updated;
  },
  async remove(id: string): Promise<boolean> {
    let found = false;
    await updateJson<BlogPost[]>("blog.json", [], (items) =>
      items.filter((p) => {
        if (p.id === id) found = true;
        return p.id !== id;
      }),
    );
    return found;
  },
};

// ---- Media -----------------------------------------------------------------

export const mediaRepo = {
  async all(): Promise<MediaItem[]> {
    const items = await readJson<MediaItem[]>("media.json", []);
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
  async add(item: MediaItem): Promise<MediaItem> {
    await updateJson<MediaItem[]>("media.json", [], (items) => [item, ...items]);
    return item;
  },
  async remove(id: string): Promise<MediaItem | null> {
    let removed: MediaItem | null = null;
    await updateJson<MediaItem[]>("media.json", [], (items) =>
      items.filter((m) => {
        if (m.id === id) removed = m;
        return m.id !== id;
      }),
    );
    return removed;
  },
};

// ---- Builds ----------------------------------------------------------------

export const buildsRepo = {
  async all(): Promise<Build[]> {
    const items = await readJson<Build[]>("builds.json", []);
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
  async add(item: Build): Promise<Build> {
    await updateJson<Build[]>("builds.json", [], (items) => [item, ...items]);
    return item;
  },
  async remove(id: string): Promise<Build | null> {
    let removed: Build | null = null;
    await updateJson<Build[]>("builds.json", [], (items) =>
      items.filter((b) => {
        if (b.id === id) removed = b;
        return b.id !== id;
      }),
    );
    return removed;
  },
};

// ---- Messages --------------------------------------------------------------

export const messagesRepo = {
  async all(): Promise<Message[]> {
    const items = await readJson<Message[]>("messages.json", []);
    return [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
  async unreadCount(): Promise<number> {
    return (await this.all()).filter((m) => !m.read).length;
  },
  async byId(id: string): Promise<Message | null> {
    return (await this.all()).find((m) => m.id === id) ?? null;
  },
  async add(item: Message): Promise<Message> {
    await updateJson<Message[]>("messages.json", [], (items) => [item, ...items]);
    return item;
  },
  async setRead(id: string, read: boolean): Promise<Message | null> {
    let updated: Message | null = null;
    await updateJson<Message[]>("messages.json", [], (items) =>
      items.map((m) => {
        if (m.id !== id) return m;
        updated = { ...m, read };
        return updated;
      }),
    );
    return updated;
  },
  async remove(id: string): Promise<boolean> {
    let found = false;
    await updateJson<Message[]>("messages.json", [], (items) =>
      items.filter((m) => {
        if (m.id === id) found = true;
        return m.id !== id;
      }),
    );
    return found;
  },
};

// ---- Settings / content collections -----------------------------------------

import { fallbackSettings } from "./defaults";

export const settingsRepo = {
  async get(): Promise<Settings> {
    const s = await readJson<Settings>("settings.json", fallbackSettings);
    return { ...fallbackSettings, ...s, site: { ...fallbackSettings.site, ...s?.site }, profile: { ...fallbackSettings.profile, ...s?.profile } };
  },
  async save(settings: Settings): Promise<Settings> {
    await writeJson("settings.json", settings);
    return settings;
  },
};

export const skillsRepo = {
  async all(): Promise<SkillGroup[]> {
    const items = await readJson<SkillGroup[]>("skills.json", []);
    return [...items].sort((a, b) => a.order - b.order);
  },
};

export const experienceRepo = {
  async all(): Promise<ExperienceEntry[]> {
    const items = await readJson<ExperienceEntry[]>("experience.json", []);
    return [...items].sort((a, b) => a.order - b.order);
  },
};

export const certificationsRepo = {
  async all(): Promise<Certification[]> {
    const items = await readJson<Certification[]>("certifications.json", []);
    return [...items].sort((a, b) => a.order - b.order);
  },
};

export const educationRepo = {
  async all(): Promise<EducationEntry[]> {
    const items = await readJson<EducationEntry[]>("education.json", []);
    return [...items].sort((a, b) => a.order - b.order);
  },
};
