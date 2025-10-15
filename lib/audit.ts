import { prisma } from "@/lib/prisma";

export async function logAudit(
  classId: string,
  type: string,
  opts?: { actorId?: string | null; metadata?: any }
) {
  try {
    await prisma.auditLog.create({
      data: {
        classId,
        actorId: opts?.actorId ?? null,
        type,
        metadata: opts?.metadata ?? null,
      },
    });
  } catch (err) {
    // auditoria não deve derrubar a request principal
    console.error("auditLog error", { classId, type, err });
  }
}
