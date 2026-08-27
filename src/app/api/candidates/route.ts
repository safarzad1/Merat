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
    const locationType = request.nextUrl.searchParams.get("locationType") || "";
    const locationId = positiveInteger(request.nextUrl.searchParams.get("locationId"));
    const provinceId = positiveInteger(request.nextUrl.searchParams.get("provinceId"));
    const pageNumber = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize") || 15) || 15));
    const searchText = (request.nextUrl.searchParams.get("search") || "").trim().slice(0, 250) || null;
    if (!Number.isInteger(currentMahal) || currentMahal < 1) return NextResponse.json({ message: "محل خدمت کاربر معتبر نیست." }, { status: 403 });
    if (!electionId || !["headquarters", "province", "district"].includes(locationType)) return NextResponse.json({ message: "دوره یا محل انتخاب‌شده معتبر نیست." }, { status: 400 });
    const pool = await getConnection();
    const result = await pool.request()
      .input("CurrentMahal", sql.Int, currentMahal)
      .input("CodeEntekhabat", sql.BigInt, String(electionId))
      .input("LocationType", sql.VarChar(20), locationType)
      .input("LocationId", sql.Int, locationId)
      .input("ProvinceId", sql.Int, provinceId)
      .input("PageNumber", sql.Int, pageNumber)
      .input("PageSize", sql.Int, pageSize)
      .input("SearchText", sql.NVarChar(250), searchText)
      .execute("Davtalab.SP_Ashkhas_List");
    const response = NextResponse.json({ items: result.recordsets[0] ?? [], totalCount: String(result.recordsets[1]?.[0]?.TotalCount ?? 0), pageNumber, pageSize });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading candidates failed", error);
    return NextResponse.json({ message: (error as { message?: string }).message || "دریافت فهرست داوطلبان با خطا مواجه شد." }, { status: 500 });
  }
}
