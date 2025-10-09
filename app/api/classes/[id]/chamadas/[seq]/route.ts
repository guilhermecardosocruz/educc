import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(100).optional()
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true, name: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const attendance = await prisma.attendance.findUnique({
    where: { classId_seq: { classId: id, seq: Number(seq) } },
    select: { seq: true, title: true }
  });

  const content = await prisma.content.findUnique({
    where: { classId_seq: { classId: id, seq: Number(seq) } },
    select: { seq: true, title: true, bodyHtml: true }
  });

  if (!attendance) return NextResponse.json({ ok:false }, { status: 404 });

  return NextResponse.json({ ok:true, class: { id, name: cls.name }, attendance, content });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const body = await req.json().catch(()=> ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.attendance.update({
    where: { classId_seq: { classId: id, seq: Number(seq) } },
    data: { title: parsed.data.title },
    select: { seq: true, title: true }
  });

  return NextResponse.json({ ok:true, attendance: updated });
}
