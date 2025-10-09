import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const studentSchema = z.object({
  name: z.string().trim().min(2),
  cpf: z.string().trim().min(11),
  contact: z.string().trim().min(5)
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { classId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, cpf: true, contact: true }
  });

  return NextResponse.json({ ok:true, students });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const body = await req.json().catch(()=> ({}));
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const st = await prisma.student.create({
    data: { classId: id, ...parsed.data },
    select: { id: true, name: true, cpf: true, contact: true }
  });

  return NextResponse.json({ ok:true, student: st }, { status: 201 });
}
