import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

// GET: lista grupos do usuário logado
export async function GET() {
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status:401 });

  const groups = await prisma.group.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    select: { id:true, name:true, createdAt:true }
  });

  return NextResponse.json({ ok:true, groups });
}

// POST: cria grupo (pode já receber classIds[])
const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  classIds: z.array(z.string().min(1)).optional()
});

export async function POST(req: Request) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ ok:false }, { status:401 });

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status:400 });

  const classIds = parsed.data.classIds ?? [];

  const allowed = await prisma.class.findMany({
    where: {
      id: { in: classIds },
      OR: [{ ownerId: me.id }, { accesses: { some: { userId: me.id } } }]
    },
    select: { id:true }
  });

  const created = await prisma.group.create({
    data: {
      userId: me.id,
      name: parsed.data.name,
      memberships: allowed.length
        ? { createMany: { data: allowed.map(c => ({ classId: c.id })) } }
        : undefined
    },
    select: { id:true, name:true, createdAt:true }
  });

  return NextResponse.json({ ok:true, group: created }, { status:201 });
}
