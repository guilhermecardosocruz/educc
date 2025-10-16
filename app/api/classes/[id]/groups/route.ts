import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// GET: lista grupos do usuário + indicação se a turma está em cada grupo
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params; // classId
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status:401 });

  const can = await prisma.class.findFirst({
    where: { id, OR: [{ ownerId: me.id }, { accesses: { some: { userId: me.id } } }] },
    select: { id:true }
  });
  if (!can) return NextResponse.json({ ok:false, error:"Sem acesso à turma" }, { status:403 });

  const groups = await prisma.group.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    select: { id:true, name:true, memberships: { where: { classId: id }, select: { id:true } } }
  });

  const list = groups.map(g => ({ id: g.id, name: g.name, linked: g.memberships.length > 0 }));
  return NextResponse.json({ ok:true, groups: list });
}
