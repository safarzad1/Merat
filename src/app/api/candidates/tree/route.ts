import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

export const runtime = "nodejs";

function positiveInteger(value: string | null) { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null; }

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
  try {
    const user = verifyToken(token) as { mahal?: unknown };
    const currentMahal = Number(user.mahal);
    const electionId = positiveInteger(request.nextUrl.searchParams.get("electionId"));
    const parentProvinceText = request.nextUrl.searchParams.get("provinceId");
    const parentProvince = parentProvinceText === null ? null : positiveInteger(parentProvinceText);
    if (!Number.isInteger(currentMahal) || currentMahal < 1) return NextResponse.json({ message: "محل خدمت کاربر معتبر نیست." }, { status: 403 });
    if (!electionId || (parentProvinceText !== null && !parentProvince)) return NextResponse.json({ message: "پارامترهای درخت معتبر نیستند." }, { status: 400 });
    const pool = await getConnection();
    const result = await pool.request()
      .input("CurrentMahal", sql.Int, currentMahal)
      .input("CodeEntekhabat", sql.BigInt, String(electionId))
      .input("ParentOstan", sql.Int, parentProvince)
      .execute("Davtalab.SP_Ashkhas_LocationTree");
    const response = NextResponse.json({ scope: currentMahal === 1 ? "headquarters" : "province", locations: result.recordset ?? [] });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading candidate location tree failed", error);
    return NextResponse.json({ message: (error as { message?: string }).message || "دریافت ساختار محل‌ها با خطا مواجه شد." }, { status: 500 });
  }
}
