import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  try {
    clearSessionCookie();
    return NextResponse.json({ ok:true });
  } catch {
    return NextResponse.json({ ok:false }, { status: 500 });
  }
}
