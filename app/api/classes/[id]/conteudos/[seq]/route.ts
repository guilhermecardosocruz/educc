import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const content = await prisma.content.findUnique({
    where: { classId_seq: { classId: id, seq: Number(seq) } },
    select: { seq: true, title: true, bodyHtml: true, classId: true }
  });

  if (!content) return NextResponse.json({ ok:true, content: null });

  return NextResponse.json({ ok:true, content });
}
