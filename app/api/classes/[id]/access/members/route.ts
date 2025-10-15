import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getMyRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET -> lista membros com papéis
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status: 401 });

  const myRole = await getMyRole(id);
  if (!myRole) return NextResponse.json({ ok:false }, { status: 403 });

  const members = await prisma.classAccess.findMany({
    where: { classId: id },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { userId:true, role:true, createdAt:true, user: { select: { id:true, name:true, email:true } } }
  });

  return NextResponse.json({ ok:true, members });
}

// DELETE -> revogar acesso (query: ?userId=...)
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status: 401 });

  const myRole = await getMyRole(id);
  if (!myRole) return NextResponse.json({ ok:false }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ ok:false, error:"userId é obrigatório" }, { status: 400 });

  // regra: apenas GESTOR pode remover PROFESSOR; professor não remove gestor
  const target = await prisma.classAccess.findFirst({
    where: { classId: id, userId },
    select: { id:true, role:true }
  });
  if (!target) return NextResponse.json({ ok:false, error:"membro não encontrado" }, { status: 404 });

  if (target.role === "PROFESSOR" && myRole !== "GESTOR") {
    return NextResponse.json({ ok:false, error:"apenas gestor pode remover professor" }, { status: 403 });
  }
  // impedir remover a si mesmo como último acesso?
  // (por simplicidade, não tratamos aqui)

  await prisma.$transaction(async (tx) => {
    await tx.classAccess.delete({ where: { id: target.id } });
    await tx.auditLog.create({
      data: {
        classId: id,
        actorId: me.id,
        type: "ACCESS_REVOKED",
        metadata: { targetUserId: userId, targetRole: target.role }
      }
    });
  });

  return NextResponse.json({ ok:true });
}
