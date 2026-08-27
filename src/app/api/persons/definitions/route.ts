import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

export const runtime = "nodejs";

function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;
  try {
    verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

function parentIdOf(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  try {
    const parentId = BigInt(normalized);
    return parentId > 0n && parentId <= 9223372036854775807n ? parentId.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request))
    return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });

  const parentId = parentIdOf(request.nextUrl.searchParams.get("parentId"));
  if (!parentId)
    return NextResponse.json({ message: "کد تعریف پایه معتبر نیست." }, { status: 400 });

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("ParentId", sql.BigInt, parentId)
      .execute("Person.SP_Persons_DefinitionOptions");
    const response = NextResponse.json({ items: result.recordset ?? [] });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading person definition options failed", error);
    return NextResponse.json({ message: "دریافت گزینه‌های تعریف پایه با خطا مواجه شد." }, { status: 500 });
  }
}
