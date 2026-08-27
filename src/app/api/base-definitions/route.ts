import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

export const runtime = "nodejs";

type DefinitionBody = {
  id?: unknown;
  pid?: unknown;
  nameFarsi?: unknown;
  value?: unknown;
};

const maxSqlBigInt = BigInt("9223372036854775807");
const minSqlBigInt = BigInt("-9223372036854775808");

function isAuthorized(request: NextRequest): boolean {
  const token = request.cookies.get("token")?.value;
  if (!token) return false;

  try {
    verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

function parseRequiredId(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  if (!/^-?\d+$/.test(normalized)) return null;

  try {
    const parsed = BigInt(normalized);
    return parsed >= minSqlBigInt && parsed <= maxSqlBigInt ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function parseOptionalId(value: unknown): string | null | undefined {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return parseRequiredId(normalized) ?? undefined;
}

function parseOptionalInt(value: unknown): number | null | undefined {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  if (!/^-?\d+$/.test(normalized)) return undefined;

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed >= -2147483648 && parsed <= 2147483647
    ? parsed
    : undefined;
}

function unauthorized() {
  return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        CONVERT(VARCHAR(20), [ID]) AS [ID],
        CASE WHEN [PID] IS NULL THEN NULL ELSE CONVERT(VARCHAR(20), [PID]) END AS [PID],
        [NameFarsi],
        [Value]
      FROM [dbo].[DFN]
      ORDER BY CASE WHEN [PID] IS NULL THEN 0 ELSE 1 END, [PID], [ID];
    `);

    const response = NextResponse.json({ items: result.recordset });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading base definitions failed", error);
    return NextResponse.json(
      { message: "دریافت تعاریف پایه با خطا مواجه شد." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = await request.json() as DefinitionBody;
    const id = parseRequiredId(body.id);
    const pid = parseOptionalId(body.pid);
    const value = parseOptionalInt(body.value);
    const nameFarsi = String(body.nameFarsi ?? "").trim();

    if (!id) {
      return NextResponse.json({ message: "شناسه باید یک عدد صحیح معتبر باشد." }, { status: 400 });
    }
    if (pid === undefined) {
      return NextResponse.json({ message: "شناسه والد معتبر نیست." }, { status: 400 });
    }
    if (pid === id) {
      return NextResponse.json({ message: "شناسه والد نمی‌تواند با شناسه رکورد برابر باشد." }, { status: 400 });
    }
    if (!nameFarsi) {
      return NextResponse.json({ message: "عنوان فارسی الزامی است." }, { status: 400 });
    }
    if (value === undefined) {
      return NextResponse.json({ message: "مقدار باید عدد صحیح باشد." }, { status: 400 });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("ID", sql.VarChar(20), id)
      .input("PID", sql.VarChar(20), pid)
      .input("NameFarsi", sql.NVarChar(2500), nameFarsi)
      .input("Value", sql.Int, value)
      .query(`
        IF EXISTS (SELECT 1 FROM [dbo].[DFN] WHERE [ID] = CONVERT(BIGINT, @ID))
        BEGIN
          SELECT CAST(0 AS BIT) AS [Inserted];
        END
        ELSE
        BEGIN
          INSERT INTO [dbo].[DFN] ([ID], [PID], [NameFarsi], [Value])
          VALUES
          (
            CONVERT(BIGINT, @ID),
            CASE WHEN @PID IS NULL THEN NULL ELSE CONVERT(BIGINT, @PID) END,
            @NameFarsi,
            @Value
          );

          SELECT CAST(1 AS BIT) AS [Inserted];
        END;
      `);

    if (!result.recordset[0]?.Inserted) {
      return NextResponse.json({ message: "این شناسه قبلاً ثبت شده است." }, { status: 409 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Creating base definition failed", error);
    return NextResponse.json(
      { message: "ثبت تعریف پایه با خطا مواجه شد." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const body = await request.json() as DefinitionBody;
    const id = parseRequiredId(body.id);
    const pid = parseOptionalId(body.pid);
    const value = parseOptionalInt(body.value);
    const nameFarsi = String(body.nameFarsi ?? "").trim();

    if (!id) {
      return NextResponse.json({ message: "شناسه رکورد معتبر نیست." }, { status: 400 });
    }
    if (pid === undefined || pid === id) {
      return NextResponse.json({ message: "شناسه والد معتبر نیست." }, { status: 400 });
    }
    if (!nameFarsi) {
      return NextResponse.json({ message: "عنوان فارسی الزامی است." }, { status: 400 });
    }
    if (value === undefined) {
      return NextResponse.json({ message: "مقدار باید عدد صحیح باشد." }, { status: 400 });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("ID", sql.VarChar(20), id)
      .input("PID", sql.VarChar(20), pid)
      .input("NameFarsi", sql.NVarChar(2500), nameFarsi)
      .input("Value", sql.Int, value)
      .query(`
        UPDATE [dbo].[DFN]
        SET
          [PID] = CASE WHEN @PID IS NULL THEN NULL ELSE CONVERT(BIGINT, @PID) END,
          [NameFarsi] = @NameFarsi,
          [Value] = @Value
        WHERE [ID] = CONVERT(BIGINT, @ID);

        SELECT @@ROWCOUNT AS [AffectedRows];
      `);

    if (Number(result.recordset[0]?.AffectedRows ?? 0) === 0) {
      return NextResponse.json({ message: "رکورد موردنظر پیدا نشد." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Updating base definition failed", error);
    return NextResponse.json(
      { message: "ویرایش تعریف پایه با خطا مواجه شد." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  try {
    const id = parseRequiredId(request.nextUrl.searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ message: "شناسه رکورد معتبر نیست." }, { status: 400 });
    }

    const pool = await getConnection();
    const result = await pool
      .request()
      .input("ID", sql.VarChar(20), id)
      .query(`
        IF EXISTS (SELECT 1 FROM [dbo].[DFN] WHERE [PID] = CONVERT(BIGINT, @ID))
        BEGIN
          SELECT N'HAS_CHILDREN' AS [Result];
        END
        ELSE
        BEGIN
          DELETE FROM [dbo].[DFN]
          WHERE [ID] = CONVERT(BIGINT, @ID);

          SELECT CASE WHEN @@ROWCOUNT = 1 THEN N'DELETED' ELSE N'NOT_FOUND' END AS [Result];
        END;
      `);

    const deleteResult = String(result.recordset[0]?.Result ?? "");
    if (deleteResult === "HAS_CHILDREN") {
      return NextResponse.json(
        { message: "این رکورد دارای زیرمجموعه است و قابل حذف نیست." },
        { status: 409 },
      );
    }
    if (deleteResult === "NOT_FOUND") {
      return NextResponse.json({ message: "رکورد موردنظر پیدا نشد." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Deleting base definition failed", error);
    return NextResponse.json(
      { message: "حذف تعریف پایه با خطا مواجه شد." },
      { status: 500 },
    );
  }
}
