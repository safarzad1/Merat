import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken } from "@/Lib/auth.js";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyToken(token);
    const response = NextResponse.json({
      user: {
        userId: payload.userId,
        personId: payload.personId,
        codeMelli: payload.codeMelli,
        fullName: payload.fullName,
        mahal: payload.mahal,
        postId: payload.postId,
      },
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
