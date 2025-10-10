import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const schema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
});

// PATCH /api/classes/:id/students/:studentId  -> editar nome
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  const exists = await prisma.student.findFirst({
    where: { id: studentId, classId: id, cls: { ownerId: user.id } },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ ok: false, error: "Aluno não encontrado" }, { status: 404 });

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

// DELETE /api/classes/:id/students/:studentId -> excluir aluno
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  const exists = await prisma.student.findFirst({
    where: { id: studentId, classId: id, cls: { ownerId: user.id } },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ ok: false, error: "Aluno não encontrado" }, { status: 404 });

  try {
    await prisma.student.delete({ where: { id: studentId } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { ok: false, error: "Não foi possível excluir: o aluno está vinculado a presenças." },
        { status: 409 }
      );
    }
    console.error("DELETE student error:", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao excluir aluno." }, { status: 500 });
  }
}
