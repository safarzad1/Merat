import sql, { type Request } from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { verifyToken, type MeratTokenPayload } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

export const runtime = "nodejs";

type PersonBody = {
  personId?: unknown;
  shomarehParvandeh?: unknown;
  codeMelli?: unknown;
  serialKartMelli?: unknown;
  telHamrah?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  fatherName?: unknown;
  tarikhTavalod?: unknown;
  shomareShenasnameh?: unknown;
  serialShenasnameh?: unknown;
  mahalTavalod?: unknown;
  mahalSodor?: unknown;
  jensiyat?: unknown;
  taahol?: unknown;
  dinMazhab?: unknown;
  isActive?: unknown;
  phoneNumber?: unknown;
  mahal?: unknown;
};

type ValidatedPerson = {
  shomarehParvandeh: string | null;
  codeMelli: string;
  serialKartMelli: string | null;
  telHamrah: string | null;
  firstName: string;
  lastName: string;
  fatherName: string | null;
  tarikhTavalod: string | null;
  shomareShenasnameh: string | null;
  serialShenasnameh: string | null;
  mahalTavalod: number | null;
  mahalSodor: number | null;
  jensiyat: number | null;
  taahol: number | null;
  dinMazhab: number | null;
  isActive: boolean;
  phoneNumber: string | null;
  mahal: number;
};

function getUser(request: NextRequest): MeratTokenPayload | null {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

function normalizeDigits(value: unknown): string {
  return String(value ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .trim();
}

function requiredBigInt(value: unknown): string | null {
  const normalized = normalizeDigits(value);
  if (!/^\d+$/.test(normalized)) return null;
  try {
    const parsed = BigInt(normalized);
    return parsed > 0n && parsed <= 9223372036854775807n ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function optionalBigInt(value: unknown): string | null | undefined {
  const normalized = normalizeDigits(value);
  if (!normalized) return null;
  return requiredBigInt(normalized) ?? undefined;
}

function optionalInt(value: unknown): number | null | undefined {
  const normalized = normalizeDigits(value);
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 2147483647 ? parsed : undefined;
}

function text(value: unknown, maxLength: number): string | null {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function isValidNationalCode(value: string): boolean {
  if (!/^\d{10}$/.test(value) || /^(\d)\1{9}$/.test(value)) return false;
  const check = Number(value[9]);
  const sum = value.slice(0, 9).split("").reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  return check === (remainder < 2 ? remainder : 11 - remainder);
}

function sqlErrorMessage(error: unknown, fallback: string): string {
  const sqlError = error as { number?: number; message?: string };
  if ([51001, 51002, 51003, 51004, 51005, 51006].includes(Number(sqlError.number))) {
    return sqlError.message || fallback;
  }
  return fallback;
}

function sqlErrorStatus(error: unknown): number {
  const errorNumber = Number((error as { number?: number }).number);
  if ([51005, 51006].includes(errorNumber)) return 400;
  if ([51001, 51002, 51003].includes(errorNumber)) return 409;
  if (errorNumber === 51004) return 404;
  return 500;
}

function validateBody(body: PersonBody): { error: string } | { value: ValidatedPerson } {
  const shomarehParvandeh = optionalBigInt(body.shomarehParvandeh);
  const codeMelli = normalizeDigits(body.codeMelli);
  const telHamrah = normalizeDigits(body.telHamrah);
  const firstName = text(body.firstName, 100);
  const lastName = text(body.lastName, 200);
  const mahal = optionalInt(body.mahal);
  const mahalTavalod = optionalInt(body.mahalTavalod);
  const mahalSodor = optionalInt(body.mahalSodor);
  const jensiyat = optionalInt(body.jensiyat);
  const taahol = optionalInt(body.taahol);
  const dinMazhab = optionalInt(body.dinMazhab);
  const tarikhTavalod = normalizeDigits(body.tarikhTavalod);

  if (shomarehParvandeh === undefined) return { error: "شماره پرونده معتبر نیست." } as const;
  if (!isValidNationalCode(codeMelli)) return { error: "کد ملی واردشده معتبر نیست." } as const;
  if (telHamrah && !/^09\d{9}$/.test(telHamrah)) return { error: "شماره همراه باید با ۰۹ شروع شود و ۱۱ رقم باشد." } as const;
  if (!firstName) return { error: "نام الزامی است." } as const;
  if (!lastName) return { error: "نام خانوادگی الزامی است." } as const;
  if (mahal === null || mahal === undefined || mahal < 1) return { error: "محل خدمت را انتخاب کنید." } as const;
  if ([mahalTavalod, mahalSodor, jensiyat, taahol, dinMazhab].includes(undefined)) return { error: "یکی از مقادیر عددی معتبر نیست." } as const;
  if (!tarikhTavalod || !/^\d{4}\/\d{2}\/\d{2}$/.test(tarikhTavalod)) return { error: "تاریخ تولد الزامی و باید معتبر باشد." } as const;
  if (jensiyat === null || jensiyat === undefined) return { error: "جنسیت را انتخاب کنید." } as const;
  if (taahol === null || taahol === undefined) return { error: "وضعیت تأهل را انتخاب کنید." } as const;
  if (dinMazhab === null || dinMazhab === undefined) return { error: "دین و مذهب را انتخاب کنید." } as const;

  return {
    value: {
      shomarehParvandeh,
      codeMelli,
      serialKartMelli: text(body.serialKartMelli, 30),
      telHamrah: telHamrah || null,
      firstName,
      lastName,
      fatherName: text(body.fatherName, 100),
      tarikhTavalod: tarikhTavalod || null,
      shomareShenasnameh: text(body.shomareShenasnameh, 30),
      serialShenasnameh: text(body.serialShenasnameh, 30),
      mahalTavalod: mahalTavalod ?? null,
      mahalSodor: mahalSodor ?? null,
      jensiyat: jensiyat ?? null,
      taahol: taahol ?? null,
      dinMazhab: dinMazhab ?? null,
      isActive: body.isActive !== false,
      phoneNumber: text(body.phoneNumber, 20),
      mahal,
    },
  } as const;
}

function addPersonInputs(request: Request, person: ValidatedPerson) {
  return request
    .input("ShomarehParvandeh", sql.BigInt, person.shomarehParvandeh)
    .input("CodeMelli", sql.VarChar(10), person.codeMelli)
    .input("SerialKartMelli", sql.NVarChar(30), person.serialKartMelli)
    .input("TelHamrah", sql.VarChar(15), person.telHamrah)
    .input("FirstName", sql.NVarChar(100), person.firstName)
    .input("LastName", sql.NVarChar(200), person.lastName)
    .input("FatherName", sql.NVarChar(100), person.fatherName)
    .input("TarikhTavalod", sql.NChar(10), person.tarikhTavalod)
    .input("ShomareShenasnameh", sql.NVarChar(30), person.shomareShenasnameh)
    .input("SerialShenasnameh", sql.NVarChar(30), person.serialShenasnameh)
    .input("MahalTavalod", sql.Int, person.mahalTavalod)
    .input("MahalSodor", sql.Int, person.mahalSodor)
    .input("Jensiyat", sql.Int, person.jensiyat)
    .input("Taahol", sql.Int, person.taahol)
    .input("Din_Mazhab", sql.Int, person.dinMazhab)
    .input("IsActive", sql.Bit, person.isActive)
    .input("PhoneNumber", sql.VarChar(20), person.phoneNumber)
    .input("Mahal", sql.Int, person.mahal);
}

export async function GET(request: NextRequest) {
  if (!getUser(request)) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });

  const pageNumber = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize") || 15) || 15));
  const searchText = text(request.nextUrl.searchParams.get("search"), 250);
  const activeParam = request.nextUrl.searchParams.get("active");
  const isActive = activeParam === "1" ? true : activeParam === "0" ? false : null;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("PageNumber", sql.Int, pageNumber)
      .input("PageSize", sql.Int, pageSize)
      .input("SearchText", sql.NVarChar(250), searchText)
      .input("IsActive", sql.Bit, isActive)
      .execute("Person.SP_Persons_List");

    const response = NextResponse.json({
      items: result.recordsets[0] ?? [],
      totalCount: String(result.recordsets[1]?.[0]?.TotalCount ?? 0),
      pageNumber,
      pageSize,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Loading persons failed", error);
    return NextResponse.json({ message: "دریافت فهرست اشخاص با خطا مواجه شد." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUser(request);
  if (!user) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });

  try {
    const validation = validateBody(await request.json() as PersonBody);
    if ("error" in validation) return NextResponse.json({ message: validation.error }, { status: 400 });

    const pool = await getConnection();
    const dbRequest = addPersonInputs(pool.request(), validation.value)
      .input("CreateUserId", sql.BigInt, user.userId);
    const result = await dbRequest.execute("Person.SP_Persons_Insert");
    return NextResponse.json({ ok: true, personId: result.recordset[0]?.PersonId }, { status: 201 });
  } catch (error) {
    console.error("Creating person failed", error);
    return NextResponse.json({ message: sqlErrorMessage(error, "ثبت شخص با خطا مواجه شد.") }, { status: sqlErrorStatus(error) });
  }
}

export async function PUT(request: NextRequest) {
  if (!getUser(request)) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });

  try {
    const body = await request.json() as PersonBody;
    const personId = requiredBigInt(body.personId);
    if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });
    const validation = validateBody(body);
    if ("error" in validation) return NextResponse.json({ message: validation.error }, { status: 400 });

    const pool = await getConnection();
    const dbRequest = addPersonInputs(pool.request(), validation.value)
      .input("PersonId", sql.BigInt, personId);
    await dbRequest.execute("Person.SP_Persons_Update");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Updating person failed", error);
    return NextResponse.json({ message: sqlErrorMessage(error, "ویرایش شخص با خطا مواجه شد.") }, { status: sqlErrorStatus(error) });
  }
}

export async function DELETE(request: NextRequest) {
  if (!getUser(request)) return NextResponse.json({ message: "نشست کاربری معتبر نیست." }, { status: 401 });
  const personId = requiredBigInt(request.nextUrl.searchParams.get("id"));
  if (!personId) return NextResponse.json({ message: "شناسه شخص معتبر نیست." }, { status: 400 });

  try {
    const pool = await getConnection();
    await pool.request().input("PersonId", sql.BigInt, personId).execute("Person.SP_Persons_Delete");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Deleting person failed", error);
    return NextResponse.json({ message: sqlErrorMessage(error, "حذف شخص با خطا مواجه شد.") }, { status: sqlErrorStatus(error) });
  }
}
