import { prisma } from "@/lib/prisma";

type ClaimInput = { token: string; userId: string; expectedClassId?: string };
type ClaimResult = { ok: true; classId: string; roleGranted: "PROFESSOR"|"GESTOR" } |
                   { ok: false; error: string; status?: number };

export async function claimToken(input: ClaimInput): Promise<ClaimResult> {
  const link = await prisma.shareLink.findFirst({
    where: { token: input.token },
    select: { id:true, classId:true, role:true, createdBy:true }
  });
  if (!link) return { ok:false, error:"link inválido ou revogado", status: 404 };
  if (input.expectedClassId && input.expectedClassId !== link.classId) {
    return { ok:false, error:"token não corresponde à turma", status: 400 };
  }

  return prisma.$transaction(async (tx) => {
    // verifica se já tem acesso
    const existing = await tx.classAccess.findFirst({
      where: { classId: link.classId, userId: input.userId }
    });
    if (existing) {
      // já tem acesso — nada a fazer
      await tx.auditLog.create({
        data: { classId: link.classId, actorId: input.userId, type: "LINK_CLAIMED_ALREADY", metadata: { linkId: link.id } }
      });
      return { ok:true, classId: link.classId, roleGranted: existing.role as any };
    }

    if (link.role === "PROFESSOR") {
      // há professor?
      const currentProf = await tx.classAccess.findFirst({
        where: { classId: link.classId, role: "PROFESSOR" },
        select: { id:true, userId:true }
      });

      if (currentProf) {
        // regra: se o PROFESSOR que gerou o link é o professor atual -> promove criador a GESTOR e dá professor ao claimant
        if (currentProf.userId === link.createdBy) {
          // 1) promove criador a GESTOR
          await tx.classAccess.update({ where: { id: currentProf.id }, data: { role: "GESTOR" } });

          // 2) concede PROFESSOR ao claimant
          await tx.classAccess.create({
            data: { classId: link.classId, userId: input.userId, role: "PROFESSOR" }
          });

          await tx.auditLog.create({
            data: {
              classId: link.classId,
              actorId: input.userId,
              type: "CREATOR_PROMOTED",
              metadata: { from: "PROFESSOR", to: "GESTOR", creatorId: link.createdBy, linkId: link.id }
            }
          });

          return { ok:true, classId: link.classId, roleGranted: "PROFESSOR" };
        }

        // se já existe professor e não é o criador → bloqueia
        await tx.auditLog.create({
          data: { classId: link.classId, actorId: input.userId, type: "CLAIM_BLOCKED_PROFESSOR_EXISTS", metadata: { linkId: link.id } }
        });
        return { ok:false, error:"esta turma já possui professor", status: 409 };
      }

      // não existe professor: concede normalmente
      await tx.classAccess.create({
        data: { classId: link.classId, userId: input.userId, role: "PROFESSOR" }
      });
      await tx.auditLog.create({
        data: { classId: link.classId, actorId: input.userId, type: "LINK_CLAIMED", metadata: { linkId: link.id, role: "PROFESSOR" } }
      });
      return { ok:true, classId: link.classId, roleGranted: "PROFESSOR" };
    }

    // link de GESTOR: concede GESTOR (ilimitado)
    await tx.classAccess.create({
      data: { classId: link.classId, userId: input.userId, role: "GESTOR" }
    });
    await tx.auditLog.create({
      data: { classId: link.classId, actorId: input.userId, type: "LINK_CLAIMED", metadata: { linkId: link.id, role: "GESTOR" } }
    });
    return { ok:true, classId: link.classId, roleGranted: "GESTOR" };
  });
}
