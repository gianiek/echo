import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, checkAuthToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!checkAuthToken(token)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|login|api/login|share|api/public|demo).*)",
  ],
};
