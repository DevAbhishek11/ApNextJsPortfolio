import { conflict, handled, ok, parseBody, unauthorized, badRequest } from "@/lib/api";
import { IS_SERVERLESS } from "@/lib/db/store";
import { getSessionUser } from "@/lib/auth/guard";
import { usersRepo } from "@/lib/db/repos";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// POST /api/settings/password — change admin password. Bumps tokenVersion,
// which invalidates every existing session (incl. this one) → re-login.
export async function POST(request: Request) {
  return handled(async () => {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    // On serverless the data dir is ephemeral and per-instance: a changed
    // password would randomly work/not work and vanish on the next cold start.
    if (IS_SERVERLESS && !process.env.DATA_DIR) {
      return conflict(
        "Password changes can't be persisted on this serverless deployment. Run `node scripts/reset-admin.mjs --seed --password=YourNewPass` locally, commit data/seed/users.seed.json and redeploy.",
      );
    }

    const limit = rateLimit(`pwd:${user.id}:${clientIp(request)}`, 5, 10 * 60_000);
    if (!limit.ok) {
      return unauthorized("Too many password change attempts. Try again later.");
    }

    const input = await parseBody(request, changePasswordSchema);
    if (input.newPassword !== input.confirmPassword) {
      return badRequest("New passwords do not match.", { confirmPassword: "Does not match new password" });
    }

    const dbUser = await usersRepo.findById(user.id);
    if (!dbUser) return unauthorized();
    const matches = await verifyPassword(input.currentPassword, dbUser.passwordHash);
    if (!matches) {
      return badRequest("Current password is incorrect.", { currentPassword: "Incorrect password" });
    }

    await usersRepo.updatePassword(user.id, await hashPassword(input.newPassword));

    const response = ok({ changed: true });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return response;
  });
}
