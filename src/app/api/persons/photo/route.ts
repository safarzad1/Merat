import { randomUUID } from "node:crypto";

import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

export const runtime = "nodejs";

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const allowedTypes: Record<string, { extension: string; contentType: string }> = {
  "image/jpeg": { extension: ".jpg", contentType: "image/jpeg" },
  "image/png": { extension: ".png", contentType: "image/png" },
  "image/webp": { extension: ".webp", contentType: "image/webp" },
};

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

function personIdOf(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) return null;
  try {
    const personId = BigInt(normalized);
    return personId > 0n && personId <= 9223372036854775807n ? personId.toString() : null;
  } catch {
    return null;
  }
}

function contentTypeOf(fileName: string, fileData: Buffer) {
  const normalized = fileName.toLowerCase();
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (fileData.length >= 8 && fileData.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (fileData.length >= 12 && fileData.toString("ascii", 0, 4) === "RIFF" && fileData.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return "image/jpeg";
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request))
    return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });

  const personId = personIdOf(request.nextUrl.searchParams.get("id"));
  if (!personId)
    return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("PersonId", sql.BigInt, personId)
      .execute("Person.SP_Persons_Photo_Get");
    const photo = result.recordset[0] as { FileName?: string; FileData?: Buffer } | undefined;
    if (!photo?.FileData || !photo.FileName)
      return NextResponse.json({ message: "تصویر پرسنلی پیدا نشد." }, { status: 404 });

    return new NextResponse(new Uint8Array(photo.FileData), {
      headers: {
        "Content-Type": contentTypeOf(photo.FileName, photo.FileData),
        "Content-Disposition": `inline; filename="${photo.FileName.replace(/[\r\n"]/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Loading person photo failed", error);
    return NextResponse.json({ message: "دریافت تصویر پرسنلی با خطا مواجه شد." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request))
    return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });

  try {
    const formData = await request.formData();
    const personId = personIdOf(formData.get("personId"));
    const photo = formData.get("photo");
    if (!personId)
      return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    if (!(photo instanceof File))
      return NextResponse.json({ message: "فایل تصویر انتخاب نشده است." }, { status: 400 });

    const imageType = allowedTypes[photo.type.toLowerCase()];
    if (!imageType)
      return NextResponse.json({ message: "فقط تصویر JPG، PNG یا WEBP قابل ثبت است." }, { status: 400 });
    if (photo.size <= 0 || photo.size > MAX_PHOTO_SIZE)
      return NextResponse.json({ message: "حجم تصویر باید حداکثر ۱۰ مگابایت باشد." }, { status: 400 });

    const fileName = `person-${personId}-${randomUUID()}${imageType.extension}`;
    const fileData = Buffer.from(await photo.arrayBuffer());
    const pool = await getConnection();
    await pool.request()
      .input("PersonId", sql.BigInt, personId)
      .input("FileName", sql.NVarChar(260), fileName)
      .input("FileData", sql.VarBinary(sql.MAX), fileData)
      .execute("Person.SP_Persons_Photo_Save");
    return NextResponse.json({ ok: true, fileName });
  } catch (error) {
    console.error("Saving person photo failed", error);
    return NextResponse.json({ message: "ذخیره تصویر پرسنلی با خطا مواجه شد." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request))
    return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });

  const personId = personIdOf(request.nextUrl.searchParams.get("id"));
  if (!personId)
    return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });

  try {
    const pool = await getConnection();
    await pool.request()
      .input("PersonId", sql.BigInt, personId)
      .execute("Person.SP_Persons_Photo_Delete");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Deleting person photo failed", error);
    return NextResponse.json({ message: "حذف تصویر پرسنلی با خطا مواجه شد." }, { status: 500 });
  }
}
