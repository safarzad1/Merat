import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
  try {
    const user = verifyToken(token) as { mahal?: unknown };
    const currentMahal = Number(user.mahal);
    if (!Number.isInteger(currentMahal) || currentMahal < 1) return NextResponse.json({ message: "محل خدمت کاربر معتبر نیست." }, { status: 403 });

    const parentIdValue = request.nextUrl.searchParams.get("parentId");
    const parentTypeValue = request.nextUrl.searchParams.get("parentType");
    const parentId = parentIdValue === null ? null : Number(parentIdValue);
    const allowedTypes = new Set(["headquarters", "province", "district", "county", "current"]);
    if (parentIdValue !== null && (parentId === null || !Number.isSafeInteger(parentId) || parentId < 1))
      return NextResponse.json({ message: "شناسه محل معتبر نیست." }, { status: 400 });
    if (parentTypeValue !== null && !allowedTypes.has(parentTypeValue))
      return NextResponse.json({ message: "نوع محل معتبر نیست." }, { status: 400 });

    const pool = await getConnection();
    const result = await pool.request()
      .input("CurrentMahal", sql.Int, currentMahal)
      .input("ParentMahal", sql.BigInt, parentId)
      .input("ParentType", sql.VarChar(20), parentTypeValue)
      .execute("Security.SP_Users_Tree");

    const response = NextResponse.json({
      scope: currentMahal === 1 ? "headquarters" : "local",
      locations: result.recordsets[0] ?? [],
      users: result.recordsets[1] ?? [],
      totalUsers: Number(result.recordsets[2]?.[0]?.TotalUsers ?? 0),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading users tree failed", error);
    return NextResponse.json({ message: "دریافت ساختار کاربران با خطا مواجه شد." }, { status: 500 });
  }
}
