import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken } from "@/Lib/auth.js";
import { shouldUseSecureCookie } from "@/Lib/loginHelpers";

function hasValidToken(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const payload = verifyToken(token);
    return Boolean(payload.userId && payload.personId);
  } catch {
    return false;
  }
}

function clearToken(response: NextResponse, request: NextRequest) {
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: shouldUseSecureCookie(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const authenticated = hasValidToken(token);
  const invalidToken = Boolean(token) && !authenticated;

  if (pathname === "/") {
    if (authenticated) return NextResponse.next();

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store");
    return invalidToken ? clearToken(response, request) : response;
  }

  if (pathname.toLowerCase() === "/login") {
    if (authenticated) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }

    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return invalidToken ? clearToken(response, request) : response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/Login"],
};
