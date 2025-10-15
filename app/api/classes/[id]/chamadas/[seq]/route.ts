import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";
import { z } from "zod";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });

  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) {
    return NextResponse.json({ ok: false, error: "Seq inválida" }, { status: 400 });
  }

  try {
    await prisma.attendance.delete({
      where: { classId_seq: { classId: id, seq: seqNum } as any },
    });
    return NextResponse.json({ ok: true });
  } catch (e1) {
    try {
      await prisma.attendance.deleteMany({
        where: { classId: id, seq: seqNum },
      });
      return NextResponse.json({ ok: true });
    } catch (e2) {
      console.error("DELETE chamada erro:", e2);
      return NextResponse.json({ ok: false, error: "Erro ao excluir chamada" }, { status: 500 });
    }
  }
}

const updateSchema = z.object({
  lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });

  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) return NextResponse.json({ ok: false, error: "Seq inválida" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });

  const updateData: any = {};
  if (parsed.data.lessonDate) {
    updateData.lessonDate = new Date(parsed.data.lessonDate + 'T00:00:00.000Z');
  }

  if (!Object.keys(updateData).length) return NextResponse.json({ ok: true, updated: 0 });

  await prisma.attendance.update({
    where: { classId_seq: { classId: id, seq: seqNum } as any },
    data: updateData
  });

  return NextResponse.json({ ok: true, updated: 1 });
}
