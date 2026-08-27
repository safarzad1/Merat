import { timingSafeEqual } from "node:crypto";

import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { generateToken, hashString } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";
import {
  normalizeLoginIdentifier,
  shouldUseSecureCookie,
} from "@/Lib/loginHelpers";

export const runtime = "nodejs";

type LoginBody = {
  identifier?: unknown;
  password?: unknown;
  rememberMe?: unknown;
};

type LoginUserRow = {
  UserId: bigint | number | string;
  PersonId: bigint | number | string;
  CodeMelli: string;
  Password: string;
  Mahal: number;
  PostId: number;
  FirstName: string;
  LastName: string;
};

function passwordMatches(password: string, storedPassword: string): boolean {
  const calculatedHash = hashString(password).toLowerCase();
  const normalizedStoredHash = String(storedPassword).trim().toLowerCase();
  const calculatedBuffer = Buffer.from(calculatedHash, "utf8");
  const storedBuffer = Buffer.from(normalizedStoredHash, "utf8");

  return calculatedBuffer.length === storedBuffer.length
    && timingSafeEqual(calculatedBuffer, storedBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginBody;
    const identifier = normalizeLoginIdentifier(body.identifier);
    const password = String(body.password ?? "");
    const rememberMe = body.rememberMe === true;

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "شناسه کاربر و کلمه عبور الزامی است." },
        { status: 400 },
      );
    }

    if (!/^\d{1,20}$/.test(identifier)) {
      return NextResponse.json(
        { message: "شناسه کاربر یا کد ملی معتبر نیست." },
        { status: 400 },
      );
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("Identifier", sql.VarChar(20), identifier)
      .query<LoginUserRow>(`
        SELECT TOP (1)
          [UserId],
          [PersonId],
          [CodeMelli],
          [Password],
          [Mahal],
          [PostId],
          [FirstName],
          [LastName]
        FROM [Security].[VW_LoginUsers]
        WHERE
          ([CodeMelli] = @Identifier OR [UserId] = TRY_CONVERT(BIGINT, @Identifier))
          AND [IsActive] = 1
          AND [IsDelete] = 0;
      `);

    const user = result.recordset[0];
    if (!user || !passwordMatches(password, user.Password)) {
      return NextResponse.json(
        { message: "شناسه کاربر، کد ملی یا کلمه عبور صحیح نیست." },
        { status: 401 },
      );
    }

    const fullName = `${user.FirstName ?? ""} ${user.LastName ?? ""}`.trim();
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 10;
    const token = generateToken(
      {
        userId: String(user.UserId),
        personId: String(user.PersonId),
        codeMelli: String(user.CodeMelli),
        fullName,
        mahal: Number(user.Mahal),
        postId: Number(user.PostId),
      },
      rememberMe ? "30d" : "10h",
    );

    const response = NextResponse.json({
      ok: true,
      user: {
        userId: String(user.UserId),
        fullName,
        mahal: Number(user.Mahal),
        postId: Number(user.PostId),
      },
    });

    response.headers.set("Cache-Control", "no-store");
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: shouldUseSecureCookie(request),
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { message: "ورود به سامانه با خطا مواجه شد." },
      { status: 500 },
    );
  }
}
