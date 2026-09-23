import { cookies } from "next/headers";
import { usersRepo } from "@/lib/db/repos";
import { assertWritableStore } from "@/lib/db/store";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { SessionUser } from "@/lib/types";

/** Full server-side session validation, including the persisted token version. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  // A backend failure must not silently become an authentication failure.
  assertWritableStore();
  const user = await usersRepo.findById(payload.sub);
  if (!user || (user.tokenVersion ?? 1) !== payload.tv) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export const ADMIN_UNAUTHORIZED = {
  success: false as const,
  error: { code: "UNAUTHORIZED", message: "Authentication required." },
};
