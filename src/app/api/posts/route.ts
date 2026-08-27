import sql from "mssql";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/Lib/auth.js";
import { getConnection } from "@/Lib/db";

function authenticated(request: NextRequest) { const token=request.cookies.get("token")?.value; if(!token)return false; try{verifyToken(token);return true;}catch{return false;} }
function postIdOf(value:unknown){const number=Number(value);return Number.isInteger(number)&&number>0?number:null;}
function typeOf(value:unknown){const number=Number(value);return Number.isInteger(number)&&number>=1&&number<=4?number:null;}
function message(error:unknown,fallback:string){return (error as {message?:string}).message||fallback;}

export async function GET(request:NextRequest){if(!authenticated(request))return NextResponse.json({message:"نشست کاربری معتبر نیست."},{status:401});try{const pool=await getConnection();const result=await pool.request().execute("Security.SP_Posts_List");return NextResponse.json({items:result.recordset??[]});}catch(error){console.error("Loading posts failed",error);return NextResponse.json({message:message(error,"دریافت سمت‌ها انجام نشد.")},{status:500});}}

export async function POST(request:NextRequest){if(!authenticated(request))return NextResponse.json({message:"نشست کاربری معتبر نیست."},{status:401});try{const body=await request.json() as {title?:unknown;placeType?:unknown};const title=String(body.title??"").trim(),placeType=typeOf(body.placeType);if(!title||!placeType)return NextResponse.json({message:"عنوان و سطح محل الزامی هستند."},{status:400});const pool=await getConnection();const result=await pool.request().input("OnvanPost",sql.NVarChar(150),title).input("TypeMahal",sql.TinyInt,placeType).execute("Security.SP_Posts_Insert");return NextResponse.json({ok:true,postId:result.recordset[0]?.PostId},{status:201});}catch(error){console.error("Creating post failed",error);return NextResponse.json({message:message(error,"ثبت سمت انجام نشد.")},{status:500});}}

export async function PUT(request:NextRequest){if(!authenticated(request))return NextResponse.json({message:"نشست کاربری معتبر نیست."},{status:401});try{const body=await request.json() as {postId?:unknown;title?:unknown;placeType?:unknown};const postId=postIdOf(body.postId),title=String(body.title??"").trim(),placeType=typeOf(body.placeType);if(!postId||!title||!placeType)return NextResponse.json({message:"شناسه، عنوان و سطح محل الزامی هستند."},{status:400});const pool=await getConnection();await pool.request().input("PostId",sql.Int,postId).input("OnvanPost",sql.NVarChar(150),title).input("TypeMahal",sql.TinyInt,placeType).execute("Security.SP_Posts_Update");return NextResponse.json({ok:true});}catch(error){console.error("Updating post failed",error);return NextResponse.json({message:message(error,"ویرایش سمت انجام نشد.")},{status:500});}}

export async function DELETE(request:NextRequest){if(!authenticated(request))return NextResponse.json({message:"نشست کاربری معتبر نیست."},{status:401});try{const postId=postIdOf(request.nextUrl.searchParams.get("id"));if(!postId)return NextResponse.json({message:"شناسه سمت معتبر نیست."},{status:400});const pool=await getConnection();await pool.request().input("PostId",sql.Int,postId).execute("Security.SP_Posts_Delete");return NextResponse.json({ok:true});}catch(error){console.error("Deleting post failed",error);return NextResponse.json({message:message(error,"حذف سمت انجام نشد.")},{status:500});}}
