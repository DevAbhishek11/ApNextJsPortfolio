import { type ClassValue, clsx } from "./clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

// --- IDs --------------------------------------------------------------------

export function uid(prefix: string): string {
  const rand =
    globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 12) ??
    Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

// --- Strings ----------------------------------------------------------------

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + "…";
}

// --- Dates ------------------------------------------------------------------

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  });
}

export function formatMonthYear(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return formatDate(iso, { month: "short", day: "numeric" });
}

// --- HTML / content helpers -------------------------------------------------

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Extracts h2/h3 headings into a TOC and injects slug ids into the HTML so
 * anchors work. Runs server-side on already-sanitized HTML.
 */
export function extractToc(html: string): { content: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();
  const content = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g,
    (match, lvl: string, attrs: string, inner: string) => {
      const text = stripHtml(inner);
      let id = slugify(text) || "section";
      let n = 2;
      while (used.has(id)) id = `${slugify(text)}-${n++}`;
      used.add(id);
      toc.push({ id, text, level: Number(lvl) as 2 | 3 });
      const attrsNoId = attrs.replace(/\s+id="[^"]*"/i, "");
      return `<h${lvl} id="${id}"${attrsNoId}>${inner}</h${lvl}>`;
    },
  );
  return { content, toc };
}

// --- Misc -------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export const baseUrl = (): string =>
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
