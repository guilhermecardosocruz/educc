import { NextResponse } from "next/server";
import { getMyRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const role = await getMyRole(id); // "PROFESSOR" | "GESTOR" | null
  if (!role) return NextResponse.json({ ok:false, role:null }, { status: 403 });
  return NextResponse.json({ ok:true, role });
}
