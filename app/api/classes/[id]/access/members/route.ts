import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getMyRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET -> lista membros
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

// POST -> conceder acesso por e-mail já cadastrado
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status: 401 });

  const myRole = await getMyRole(id);
  if (myRole !== "PROFESSOR") {
    return NextResponse.json({ ok:false, error:"Apenas professor pode convidar" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const role  = (body?.role  ?? "").toString().trim().toUpperCase();

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok:false, error:"E-mail inválido" }, { status: 400 });
  }
  if (!["PROFESSOR","GESTOR"].includes(role)) {
    return NextResponse.json({ ok:false, error:"Papel inválido" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { email },
    select: { id:true, email:true, name:true }
  });
  if (!target) {
    return NextResponse.json({ ok:false, error:"Usuário não encontrado" }, { status: 404 });
  }

  if (role === "PROFESSOR") {
    const existingProf = await prisma.classAccess.findFirst({
      where: { classId: id, role: "PROFESSOR" },
      select: { id:true, userId:true }
    });
    if (existingProf && existingProf.userId !== target.id) {
      return NextResponse.json({ ok:false, error:"Já existe um professor nesta turma." }, { status: 409 });
    }
  }

  const access = await prisma.classAccess.upsert({
    where: { class_user_unique: { classId: id, userId: target.id } },
    update: { role: role as any },
    create: { classId: id, userId: target.id, role: role as any },
    select: { userId:true, role:true }
  });

  await prisma.auditLog.create({
    data: {
      classId: id,
      actorId: me.id,
      type: "ACCESS_GRANTED_EMAIL",
      metadata: { targetEmail: email, targetUserId: target.id, role }
    }
  });

  return NextResponse.json({ ok:true, access });
}

// DELETE -> revogar acesso (?userId=...)
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status: 401 });

  const myRole = await getMyRole(id);
  if (!myRole) return NextResponse.json({ ok:false }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ ok:false, error:"userId é obrigatório" }, { status: 400 });

  const target = await prisma.classAccess.findFirst({
    where: { classId: id, userId },
    select: { id:true, role:true }
  });
  if (!target) return NextResponse.json({ ok:false, error:"membro não encontrado" }, { status: 404 });

  if (target.role === "PROFESSOR" && myRole !== "GESTOR") {
    return NextResponse.json({ ok:false, error:"apenas gestor pode remover professor" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.classAccess.delete({ where: { id: target.id } });
    await tx.auditLog.create({
      data: { classId: id, actorId: me.id, type: "ACCESS_REVOKED", metadata: { targetUserId: userId, targetRole: target.role } }
    });
  });

  return NextResponse.json({ ok:true });
}
