import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function GET() {
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status: 401 });

  // grupos do owner (escopo por usuário)
  const groups = await prisma.group.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      _count: { select: { memberships: true } }
    }
  });

  const out = groups.map(g => ({ id: g.id, name: g.name, classesCount: g._count.memberships }));
  return NextResponse.json({ ok:true, groups: out });
}
