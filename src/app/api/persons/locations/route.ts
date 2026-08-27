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
    verifyToken(token);
  } catch {
    return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
  }

  const searchText = String(request.nextUrl.searchParams.get("search") ?? "").trim().slice(0, 250) || null;
  const onlyCounty = request.nextUrl.searchParams.get("countyOnly") === "1";
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("SearchText", sql.NVarChar(250), searchText)
      .input("OnlyCounty", sql.Bit, onlyCounty)
      .execute("Person.SP_Persons_Locations");
    const response = NextResponse.json({ items: result.recordset ?? [] });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading person locations failed", error);
    return NextResponse.json({ message: "دریافت فهرست محل‌ها با خطا مواجه شد." }, { status: 500 });
  }
}
