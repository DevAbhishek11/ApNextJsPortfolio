import { cookies } from "next/headers";
import { usersRepo } from "@/lib/db/repos";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SessionUser } from "@/lib/types";

/**
 * Server-side session resolution. Used by every admin API route and the admin
 * layout — never rely on client-side navigation or the proxy alone.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const payload = await verifySessionToken(token);
    if (!payload) return null;
    const user = await usersRepo.findById(payload.sub);
    if (!user) return null;
    if ((user.tokenVersion ?? 1) !== payload.tv) return null; // password changed
    return { id: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}

export const ADMIN_UNAUTHORIZED = {
  success: false as const,
  error: { code: "UNAUTHORIZED", message: "Authentication required." },
};
