import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "ap_session";

/**
 * Route protection proxy (Next.js 16 successor to `middleware.ts`).
 *
 * Runs BEFORE any /admin page renders. It only does fast JWT signature/expiry
 * verification (no fs access here); every admin page and API route additionally
 * re-validates the session server-side, including the user's tokenVersion.
 */

const DEV_SECRET =
  "dev-only-insecure-secret-change-me-0123456789abcdef-dev-only-insecure";

function secretKey(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  return new TextEncoder().encode(raw && raw.length >= 16 ? raw : DEV_SECRET + DEV_SECRET);
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secretKey(), { issuer: "ap-portfolio" });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const valid = await hasValidSession(request);
  const onLogin = pathname === "/admin/login";

  // Never redirect a signed cookie away from the login page. The proxy only
  // verifies its signature; a password change can invalidate tokenVersion in
  // the database while the JWT is still signed. Redirecting here would loop:
  // /admin → layout rejects stale session → /admin/login → /admin ...
  if (!onLogin && !valid) {
    const login = new URL("/admin/login", request.url);
    if (pathname && pathname !== "/admin") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
