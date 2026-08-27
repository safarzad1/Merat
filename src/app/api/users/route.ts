import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hashString, verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

function positiveInteger(value: unknown) { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null; }

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
    const current = verifyToken(token) as { mahal?: unknown };
    const body = await request.json() as { userId?: unknown; personId?: unknown; locationId?: unknown; postId?: unknown; password?: unknown };
    const userId = positiveInteger(body.userId), personId = positiveInteger(body.personId), mahal = positiveInteger(body.locationId), postId = positiveInteger(body.postId);
    const password = String(body.password ?? "");
    if (!userId || !personId || !mahal || !postId) return NextResponse.json({ message: "نام کاربر، شخص، محل و سمت الزامی هستند." }, { status: 400 });
    if (password.length < 5) return NextResponse.json({ message: "رمز اولیه باید حداقل ۵ کاراکتر باشد." }, { status: 400 });
    const pool = await getConnection();
    const result = await pool.request().input("CurrentMahal", sql.Int, Number(current.mahal)).input("UserId", sql.BigInt, String(userId)).input("PersonId", sql.BigInt, String(personId)).input("Mahal", sql.Int, mahal).input("PostId", sql.Int, postId).input("PasswordHash", sql.NVarChar(500), hashString(password)).execute("Security.SP_Users_Insert");
    return NextResponse.json({ ok: true, userId: result.recordset[0]?.UserId }, { status: 201 });
  } catch (error) {
    console.error("Creating user failed", error);
    return NextResponse.json({ message: (error as { message?: string }).message || "ثبت کاربر انجام نشد." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
    const current = verifyToken(token) as { userId?: unknown; mahal?: unknown };
    const userId = positiveInteger(request.nextUrl.searchParams.get("id"));
    if (!userId) return NextResponse.json({ message: "شناسه کاربر معتبر نیست." }, { status: 400 });
    const pool = await getConnection();
    await pool.request().input("CurrentUserId", sql.BigInt, String(current.userId)).input("CurrentMahal", sql.Int, Number(current.mahal)).input("UserId", sql.BigInt, String(userId)).execute("Security.SP_Users_Delete");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Deleting user failed", error);
    return NextResponse.json({ message: (error as { message?: string }).message || "حذف کاربر انجام نشد." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
    const current = verifyToken(token) as { mahal?: unknown };
    const body = await request.json() as { userId?: unknown; password?: unknown };
    const userId = positiveInteger(body.userId);
    const password = String(body.password ?? "");
    if (!userId) return NextResponse.json({ message: "کد کاربر معتبر نیست." }, { status: 400 });
    if (password.length < 5) return NextResponse.json({ message: "کلمه عبور باید حداقل ۵ کاراکتر باشد." }, { status: 400 });
    const pool = await getConnection();
    await pool.request()
      .input("CurrentMahal", sql.Int, Number(current.mahal))
      .input("UserId", sql.BigInt, String(userId))
      .input("PasswordHash", sql.NVarChar(500), hashString(password))
      .execute("Security.SP_Users_ResetPassword");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Changing user password failed", error);
    return NextResponse.json({ message: (error as { message?: string }).message || "تغییر کلمه عبور انجام نشد." }, { status: 500 });
  }
}
