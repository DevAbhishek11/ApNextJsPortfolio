import { SESSION_COOKIE } from "@/lib/auth/session";
import { ok } from "@/lib/api";

export async function POST() {
  const response = ok({ loggedOut: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
