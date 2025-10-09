import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().trim().min(1).max(100).optional().default("Chamada")
});

// GET: lista chamadas da turma (ordenado por seq, padrão desc)
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const items = await prisma.attendance.findMany({
    where: { classId: id },
    orderBy: { seq: order },
    select: { id: true, seq: true, title: true, createdAt: true }
  });

  return NextResponse.json({ ok:true, attendances: items });
}

// POST: cria chamada com seq = max(seq)+1 (por turma), transação p/ evitar corrida
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const body = await req.json().catch(()=> ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const last = await tx.attendance.findFirst({
      where: { classId: id },
      orderBy: { seq: "desc" },
      select: { seq: true }
    });
    const nextSeq = (last?.seq ?? 0) + 1;

    const created = await tx.attendance.create({
      data: {
        classId: id,
        seq: nextSeq,
        title: parsed.data.title || `Chamada ${nextSeq}`
      },
      select: { id: true, seq: true, title: true, createdAt: true }
    });

    return created;
  });

  return NextResponse.json({ ok:true, attendance: result }, { status: 201 });
}
