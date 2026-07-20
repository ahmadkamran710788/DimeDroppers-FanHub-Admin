import { cookies } from "next/headers";

// Both cookies live as long as the refresh token (30 days) — the outer bound of a
// session. The access token JWT is much shorter-lived (60 min upstream), but its
// `exp` claim is the only authority on that; the cookie's maxAge deliberately does
// NOT mirror it.
//
// Previously the access cookie expired with the JWT, so the browser deleted it at
// the same moment the token went stale. `proxy` reads cookie *presence* to decide
// whether a session exists, so that turned a routine token expiry into a hard
// logout — while a perfectly valid refresh token sat unused in the jar. Renewal is
// handled transparently by `upstreamFetch` (utils/auth/upstream.ts).
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Sets the access + refresh tokens as httpOnly cookies. Called from the auth
// route handlers so the refresh token is never readable by client-side JS.
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions,
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getAccessToken() {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken() {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}
