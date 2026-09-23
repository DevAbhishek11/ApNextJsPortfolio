import { handled, ok, parseBody, unauthorized, badRequest } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/guard";
import { usersRepo } from "@/lib/db/repos";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// POST /api/settings/password — persist the new hash in the shared store and
// bump tokenVersion, invalidating ALL existing sessions on every instance.
export async function POST(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const limit = rateLimit(`pwd:${user.id}:${clientIp(request)}`, 5, 10 * 60_000);
    if (!limit.ok) return unauthorized("Too many password change attempts. Try again later.");

    const input = await parseBody(request, changePasswordSchema);
    if (input.newPassword !== input.confirmPassword) {
      return badRequest("New passwords do not match.", { confirmPassword: "Does not match new password" });
    }

    const changed = await usersRepo.changePassword(user.id, input.currentPassword, input.newPassword);
    if (!changed) {
      return badRequest("Current password is incorrect.", { currentPassword: "Incorrect password" });
    }

    const response = ok({ changed: true });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  });
}
