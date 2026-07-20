import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed the `middleware` file convention to `proxy`. This runs the
// auth guard before routes render: unauthenticated users are sent to sign-in,
// and signed-in users are kept out of the auth pages.
//
// The accessToken cookie is httpOnly; presence is a coarse signal only. Real
// authorization is enforced upstream by the API (and `apiRequest` calls
// `unauthorized()` on a 401). An expired access token still passes this check —
// the API rejects the request and the client can refresh.

const SETUP_WIZARD_DEFAULT = "/setup-wizard/organization-details";
const SIGN_IN = "/auth/sign-in";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("accessToken");
  const isAuthPage = pathname.startsWith("/auth");

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL(SIGN_IN, request.url));
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL(SETUP_WIZARD_DEFAULT, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  //
  // Exclude all of `_next` and `__nextjs`, not just `_next/static` and
  // `_next/image`. The dev server's HMR socket (`/_next/webpack-hmr`) and the
  // error-overlay endpoints (`/__nextjs_original-stack-frame`) are otherwise
  // matched here and, while signed out, redirected to sign-in — which kills
  // Fast Refresh and makes the dev client eventually force a full reload.
  //
  // Note that Next still runs proxy for `_next/data` routes even though they
  // are excluded here, so page-level protection is not weakened.
  matcher: [
    "/((?!api|_next|__nextjs|favicon.ico|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
