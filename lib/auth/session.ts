import { SignJWT, jwtVerify } from "jose";

// ---------------------------------------------------------------------------
// Session tokens: stateless JWT (HS256) in an HTTP-only cookie.
// The token carries a `tv` (token version) claim — bumping users.tokenVersion
// (e.g. on password change) instantly invalidates all outstanding sessions.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "ap_session";
const ISSUER = "ap-portfolio";

const DEV_FALLBACK =
  "dev-only-insecure-secret-change-me-0123456789abcdef-dev-only-insecure";

export function sessionSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      // Fail loudly in production rather than signing with a known secret.
      throw new Error(
        "JWT_SECRET is not configured. Set it in your environment (see .env.example).",
      );
    }
    return new TextEncoder().encode(DEV_FALLBACK + DEV_FALLBACK);
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  tv: number; // token version
}

export const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 24; // 24h
export const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30; // 30d

export async function signSession(payload: SessionPayload, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, tv: payload.tv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { issuer: ISSUER });
    if (typeof payload.sub !== "string" || typeof payload.tv !== "number") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      tv: payload.tv,
    };
  } catch {
    return null;
  }
}
