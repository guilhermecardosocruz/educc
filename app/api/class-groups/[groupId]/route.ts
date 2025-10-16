import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function GET(_req: Request, ctx: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status: 401 });

  // Grupo precisa ser do usuário (escopo por owner)
  const g = await prisma.group.findFirst({
    where: { id: groupId, userId: me.id },
    select: { id:true, name:true }
  });
  if (!g) return NextResponse.json({ ok:false, error:'Grupo não encontrado' }, { status: 404 });

  const memberships = await prisma.classGroupMembership.findMany({
    where: { groupId: g.id },
    select: { classId: true, cls: { select: { id:true, name:true } } },
    orderBy: { createdAt: 'asc' }
  });

  const classes = memberships.map(m => m.cls);

  return NextResponse.json({ ok:true, group: g, classes });
}
