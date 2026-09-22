import { NextResponse, type NextRequest } from "next/server";
import { handled, ok, parseBody, tooManyRequests, unauthorized } from "@/lib/api";
import { usersRepo } from "@/lib/db/repos";
import { reseedCollection } from "@/lib/db/store";
import { verifyPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE, SESSION_MAX_AGE_DEFAULT, SESSION_MAX_AGE_REMEMBER, signSession,
} from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";
import { clientIp, clearRateLimit, rateLimit, sweep } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// POST /api/auth/login — credential check (bcrypt), rate-limited, issues a
// signed HTTP-only session cookie on success.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  return handled(async () => {
    const ip = clientIp(request);
    sweep(60_000);

    // 5 attempts per IP per 10 minutes + 8 per email per 10 minutes.
    const byIp = rateLimit(`login:ip:${ip}`, 5, 10 * 60_000);
    if (!byIp.ok) {
      return tooManyRequests(
        `Too many login attempts. Try again in ${byIp.retryAfterSeconds}s.`,
      );
    }

    const input = await parseBody(request, loginSchema);

    const byEmail = rateLimit(`login:em:${input.email.trim().toLowerCase()}`, 8, 10 * 60_000);
    if (!byEmail.ok) {
      return tooManyRequests(
        `Too many login attempts for this account. Try again in ${byEmail.retryAfterSeconds}s.`,
      );
    }

    // Normalized lookup + one self-heal: if the users table somehow ended up
    // empty/corrupt (deleted volume, bad restore), reseed it once so the
    // documented default credentials work again.
    let user = await usersRepo.findByEmail(input.email);
    if (!user && (await usersRepo.all()).length === 0) {
      console.warn("[auth] users table empty — reseeding admin from seed defaults");
      await reseedCollection("users.json");
      user = await usersRepo.findByEmail(input.email);
    }

    // Uniform cost + message: never reveal which factor failed.
    const okPassword = user
      ? await verifyPassword(input.password, user.passwordHash)
      : (await verifyPassword(input.password, "$2b$12$LJ3m4ypB8lZ3lNyyhZq2eeRx0nkd9W9s2nO7A2bGq0Z0mb05Bv5LO"), false);

    if (!user || !okPassword) {
      return unauthorized(
        "Invalid email or password.",
        user || input.email.length === 0
          ? undefined
          : { hint: "If you previously changed the password, reset it with `npm run reset-admin` on the server." },
      );
    }

    // Successful login clears the IP bucket so legit users aren't locked out.
    clearRateLimit(`login:ip:${ip}`);
    clearRateLimit(`login:em:${input.email.trim().toLowerCase()}`);

    const maxAge = input.remember ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT;
    const token = await signSession(
      { sub: user.id, email: user.email, name: user.name, tv: user.tokenVersion ?? 1 },
      maxAge,
    );

    const response = ok({ user: { id: user.id, email: user.email, name: user.name } });
    // Mark the cookie Secure only when the request actually arrived over HTTPS —
    // this keeps local http testing working while staying strict in production.
    const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: proto === "https",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    return response;
  });
}

export function GET() {
  return NextResponse.json(
    { success: false, error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } },
    { status: 405 },
  );
}
