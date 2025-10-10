import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const items = await prisma.content.findMany({
    where: { classId: id },
    orderBy: { seq: "asc" },
    select: { id: true, seq: true, title: true }
  });

  return NextResponse.json({ ok:true, list: items });
}
