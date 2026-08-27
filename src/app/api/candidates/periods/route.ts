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
    if (!Number.isInteger(currentMahal) || currentMahal < 1)
      return NextResponse.json({ message: "محل خدمت کاربر معتبر نیست." }, { status: 403 });
    const pool = await getConnection();
    const result = await pool.request()
      .input("CurrentMahal", sql.Int, currentMahal)
      .execute("Davtalab.SP_Ashkhas_ElectionPeriods");
    const response = NextResponse.json({ items: result.recordset ?? [] });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading election periods failed", error);
    return NextResponse.json({ message: "دریافت دوره‌های انتخابات با خطا مواجه شد." }, { status: 500 });
  }
}
