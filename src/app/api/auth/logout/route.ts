import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { shouldUseSecureCookie } from "@/Lib/loginHelpers";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");
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
