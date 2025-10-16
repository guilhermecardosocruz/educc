import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";

// (mantém espaço para futuros GET/PUT se precisar)

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status: 401 });

  const role = await getRole(me.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
  if (role !== "PROFESSOR") {
    return NextResponse.json({ ok:false, error:"Apenas professor pode excluir a turma" }, { status: 403 });
  }

  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ ok:true, deletedId: id });
}
