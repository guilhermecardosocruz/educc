import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status:401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id:true }});
  if (!cls) return NextResponse.json({ ok:false, error:"Turma não encontrada" }, { status:404 });

  const list = await prisma.content.findMany({
    where: { classId:id },
    orderBy: { seq:"asc" },
    select: { seq:true, title:true, bodyHtml:true }
  });

  return NextResponse.json({ ok:true, list });
}
