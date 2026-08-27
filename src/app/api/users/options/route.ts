import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
    const user = verifyToken(token) as { mahal?: unknown };
    const currentMahal = Number(user.mahal);
    const targetMahal = Number(request.nextUrl.searchParams.get("locationId"));
    if (!Number.isInteger(targetMahal) || targetMahal < 1) return NextResponse.json({ message: "محل انتخاب‌شده معتبر نیست." }, { status: 400 });
    const pool = await getConnection();
    const result = await pool.request().input("CurrentMahal", sql.Int, currentMahal).input("TargetMahal", sql.Int, targetMahal).execute("Security.SP_Users_CreateOptions");
    return NextResponse.json({ persons: result.recordsets[0] ?? [], posts: result.recordsets[1] ?? [], nextUserId: String(result.recordsets[2]?.[0]?.NextUserId ?? "") });
  } catch (error) {
    console.error("Loading user options failed", error);
    return NextResponse.json({ message: (error as { message?: string }).message || "دریافت گزینه‌های کاربر انجام نشد." }, { status: 500 });
  }
}
