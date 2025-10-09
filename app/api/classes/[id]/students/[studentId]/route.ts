import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  contact: z.string().trim().min(5).optional()
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const body = await req.json().catch(()=> ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const st = await prisma.student.update({
    where: { id: studentId },
    data: parsed.data,
    select: { id: true, name: true, cpf: true, contact: true }
  });

  return NextResponse.json({ ok:true, student: st });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string; studentId: string }> }) {
  const { id, studentId } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  await prisma.student.delete({ where: { id: studentId } });
  return NextResponse.json({ ok:true });
}
