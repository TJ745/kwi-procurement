import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect for visitors without a session cookie.
 * This only checks that a cookie exists; real session and role checks run
 * on the server in each page and Server Action (see lib/session.ts).
 */
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/sign-in", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") {
    signInUrl.searchParams.set("next", pathname + search);
  }
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/((?!api/auth|sign-in|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
