/**
 * Minimal clsx implementation (avoids an extra dependency).
 * Supports strings, arrays, and conditional objects.
 */
export type ClassValue =
  | string
  | number
  | null
  | boolean
  | undefined
  | ClassValue[]
  | Record<string, boolean | null | undefined>;

export function clsx(...inputs: ClassValue[]): string {
  const out: string[] = [];
  const push = (val: ClassValue): void => {
    if (!val) return;
    if (typeof val === "string" || typeof val === "number") {
      out.push(String(val));
    } else if (Array.isArray(val)) {
      val.forEach(push);
    } else if (typeof val === "object") {
      for (const [key, enabled] of Object.entries(val)) {
        if (enabled) out.push(key);
      }
    }
  };
  inputs.forEach(push);
  return out.join(" ");
}
