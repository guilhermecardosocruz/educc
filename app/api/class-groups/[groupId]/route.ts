import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status:401 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status:400 });

  const g = await prisma.group.findFirst({ where: { id: groupId, userId: me.id }, select: { id:true }});
  if (!g) return NextResponse.json({ ok:false, error:"Grupo não encontrado" }, { status:404 });

  const updated = await prisma.group.update({
    where: { id: g.id },
    data: { name: parsed.data.name },
    select: { id:true, name:true, createdAt:true }
  });

  return NextResponse.json({ ok:true, group: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status:401 });

  const g = await prisma.group.findFirst({ where: { id: groupId, userId: me.id }, select: { id:true }});
  if (!g) return NextResponse.json({ ok:false, error:"Grupo não encontrado" }, { status:404 });

  await prisma.group.delete({ where: { id: g.id } });
  return NextResponse.json({ ok:true, deletedId: g.id });
}
