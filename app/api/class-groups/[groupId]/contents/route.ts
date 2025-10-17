import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

/**
 * GET /api/class-groups/[groupId]/contents?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Retorna, por turma do grupo, os conteúdos (seq espelhado) lecionados no período.
 * Cruza Attendance(lessonDate) com Content(seq).
 */
export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const me = await requireUser();
    if (!me) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const groupId = params.groupId;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) return NextResponse.json({ ok: false, error: "missing from/to" }, { status: 400 });

    // valida grupo pertence ao usuário
    const g = await prisma.group.findFirst({
      where: { id: groupId, userId: me.id },
      select: { id: true, name: true },
    });
    if (!g) return NextResponse.json({ ok: false, error: "group not found" }, { status: 404 });

    // classes do grupo (via membership)
    const memberships = await prisma.classGroupMembership.findMany({
      where: { groupId: g.id },
      select: { cls: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });

    const classes = memberships
      .map(m => m.cls)
      .filter((c): c is { id: string; name: string } => !!c);

    const result: Array<{
      classId: string;
      className: string;
      contents: Array<{
        seq: number;
        title: string;
        objetivos?: string | null;
        desenvolvimento?: string | null;
        recursos?: string | null;
        bncc?: string | null;
        lessonDate?: string | null; // ISO
      }>;
    }> = [];

    for (const cls of classes) {
      // Aulas no período
      const atts = await prisma.attendance.findMany({
        where: {
          classId: cls.id,
          lessonDate: { gte: new Date(from), lte: new Date(to) },
        },
        select: { seq: true, lessonDate: true },
        orderBy: { seq: "asc" },
      });

      if (atts.length === 0) {
        result.push({ classId: cls.id, className: cls.name, contents: [] });
        continue;
      }

      const seqs = atts.map(a => a.seq);
      const conts = await prisma.content.findMany({
        where: { classId: cls.id, seq: { in: seqs } },
        select: { seq: true, title: true, objetivos: true, desenvolvimento: true, recursos: true, bncc: true },
        orderBy: { seq: "asc" },
      });

      const dateBySeq = new Map(atts.map(a => [a.seq, a.lessonDate?.toISOString() ?? null]));
      const contents = conts.map(c => ({ ...c, lessonDate: dateBySeq.get(c.seq) ?? null }));

      result.push({ classId: cls.id, className: cls.name, contents });
    }

    return NextResponse.json({ ok: true, group: g, from, to, items: result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal error" }, { status: 500 });
  }
}
