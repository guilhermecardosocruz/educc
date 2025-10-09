import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });
  return NextResponse.json({ ok:true, user });
}
