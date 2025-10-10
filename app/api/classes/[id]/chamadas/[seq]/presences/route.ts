import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  presences: { studentId: string; present: boolean }[];
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;
  const seqNum = Number(seq);
  const rows = await prisma.attendancePresence.findMany({
    where: { classId: id, seq: seqNum },
    select: { studentId: true, present: true },
    orderBy: { studentId: "asc" }
  });
  return NextResponse.json({ ok: true, rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;
  const seqNum = Number(seq);
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  // valida turma (dona do user; ajuste se usar outro ACL)
  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });
  if (!cls) return NextResponse.json({ ok: false, error: "Turma não encontrada." }, { status: 404 });

  let data: Body | null = null;
  try {
    data = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  if (!data?.presences || !Array.isArray(data.presences))
    return NextResponse.json({ ok: false, error: "Payload ausente: presences[]" }, { status: 400 });

  // upsert **todos** (present = true **ou** false)
  await prisma.$transaction(async (tx) => {
    for (const p of data!.presences) {
      if (!p?.studentId) continue;
      const deterministicId = `${id}:${seqNum}:${p.studentId}`;
      await tx.attendancePresence.upsert({
        where: { id: deterministicId },
        update: { present: !!p.present },
        create: {
          id: deterministicId,
          classId: id,
          seq: seqNum,
          studentId: p.studentId,
          present: !!p.present
        }
      });
    }
  });

  return NextResponse.json({ ok: true, saved: data.presences.length });
}
