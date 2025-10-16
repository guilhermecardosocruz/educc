import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const linkSchema = z.object({
  classId: z.string().min(1),
});

export async function POST(req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status:401 });

  const body = await req.json().catch(() => ({}));
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status:400 });

  const g = await prisma.group.findFirst({ where: { id: groupId, userId: me.id }, select: { id:true }});
  if (!g) return NextResponse.json({ ok:false, error:"Grupo não encontrado" }, { status:404 });

  const cls = await prisma.class.findFirst({
    where: {
      id: parsed.data.classId,
      OR: [{ ownerId: me.id }, { accesses: { some: { userId: me.id } } }]
    },
    select: { id:true }
  });
  if (!cls) return NextResponse.json({ ok:false, error:"Sem acesso à turma" }, { status:403 });

  await prisma.classGroupMembership.create({
    data: { classId: cls.id, groupId: g.id }
  }).catch(() => null);

  return NextResponse.json({ ok:true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status:401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") || "";

  const g = await prisma.group.findFirst({ where: { id: groupId, userId: me.id }, select: { id:true }});
  if (!g) return NextResponse.json({ ok:false, error:"Grupo não encontrado" }, { status:404 });

  const membership = await prisma.classGroupMembership.findFirst({
    where: { groupId: g.id, classId },
    select: { id:true, classId:true }
  });
  if (!membership) return NextResponse.json({ ok:false, error:"Vínculo não encontrado" }, { status:404 });

  const can = await prisma.class.findFirst({
    where: {
      id: membership.classId,
      OR: [{ ownerId: me.id }, { accesses: { some: { userId: me.id } } }]
    },
    select: { id:true }
  });
  if (!can) return NextResponse.json({ ok:false, error:"Sem acesso à turma" }, { status:403 });

  await prisma.classGroupMembership.delete({ where: { id: membership.id } });
  return NextResponse.json({ ok:true });
}
