import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // garante que o aluno é da turma do usuário
  const st = await prisma.student.findFirst({
    where: { id: studentId, classId: id, cls: { ownerId: user.id } },
    select: { id: true },
  });
  if (!st) return NextResponse.json({ ok: false, error: "Aluno não encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: { name: parsed.data.name },
    select: { id: true, name: true, cpf: true, contact: true },
  });

  return NextResponse.json({ ok: true, student: updated });
}
