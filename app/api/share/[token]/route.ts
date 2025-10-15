import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function POST(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const link = await prisma.shareLink.findFirst({
    where: { token, isRevoked: false },
    select: { id:true, classId:true, role:true, isPromotional:true, createdBy:true }
  });
  if (!link) return NextResponse.json({ ok:false, error:"Link inválido" }, { status: 404 });

  const classId = link.classId;

  // Se for PROFESSOR, precisa garantir unicidade
  if (link.role === "PROFESSOR") {
    const existingProf = await prisma.classAccess.findFirst({
      where: { classId, role: "PROFESSOR" },
      select: { id:true, userId:true }
    });
    if (existingProf && existingProf.userId !== user.id) {
      // Bloqueia — já existe professor
      await logAudit(classId, "CLAIM_BLOCKED_PROFESSOR_EXISTS", {
        actorId: user.id,
        metadata: { linkId: link.id }
      });
      return NextResponse.json({ ok:false, error:"Já existe um professor nesta turma." }, { status: 409 });
    }
  }

  // Transação: marcar uso do link e conceder acesso
  const out = await prisma.$transaction(async (tx) => {
    // marca uso do link (não revoga automaticamente — fica histórico)
    await tx.shareLink.update({
      where: { id: link.id },
      data: { usedAt: new Date() },
    });

    // promoção automática?
    if (link.isPromotional && link.role === "PROFESSOR") {
      // 1) criador vira GESTOR (se ainda não for)
      await tx.classAccess.upsert({
        where: { class_user_unique: { classId, userId: link.createdBy } },
        update: { role: "GESTOR" },
        create: { classId, userId: link.createdBy, role: "GESTOR" },
      });
      // 2) convidado vira PROFESSOR
      await tx.classAccess.upsert({
        where: { class_user_unique: { classId, userId: user.id } },
        update: { role: "PROFESSOR" },
        create: { classId, userId: user.id, role: "PROFESSOR" },
      });
      return { promoted: true };
    }

    // fluxo normal: aplica o papel do link
    await tx.classAccess.upsert({
      where: { class_user_unique: { classId, userId: user.id } },
      update: { role: link.role },
      create: { classId, userId: user.id, role: link.role },
    });

    return { promoted: false };
  });

  // logs
  await logAudit(classId, "CLAIM_OK", {
    actorId: user.id,
    metadata: { linkId: link.id, role: link.role }
  });
  if (out.promoted) {
    await logAudit(classId, "CREATOR_PROMOTED", {
      actorId: user.id,
      metadata: { linkId: link.id, creatorId: link.createdBy }
    });
  }

  return NextResponse.json({ ok:true, promoted: out.promoted });
}
