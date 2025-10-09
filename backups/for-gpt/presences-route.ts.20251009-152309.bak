import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const upsertSchema = z.object({
  presences: z.array(z.object({
    studentId: z.string().min(1),
    present: z.boolean()
  })).min(1)
});

// GET: lista presenças atuais da chamada
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const rows = await prisma.attendancePresence.findMany({
    where: { classId: id, seq: Number(seq) },
    select: { studentId: true, present: true }
  });

  return NextResponse.json({ ok:true, presences: rows });
}

// POST: upsert em lote das presenças
export async function POST(req: Request, ctx: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const body = await req.json().catch(()=> ({}));
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const seqNum = Number(seq);

  await prisma.$transaction(async (tx) => {
    for (const p of parsed.data.presences) {
      const deterministicId = `${id}:${seqNum}:${p.studentId}`;
      await tx.attendancePresence.upsert({
        where: { id: deterministicId },
        update: { present: p.present },
        create: {
          id: deterministicId,
          classId: id,
          seq: seqNum,
          studentId: p.studentId,
          present: p.present
        }
      });
    }
  });

  return NextResponse.json({ ok:true });
}
