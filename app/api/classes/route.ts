import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const classes = await prisma.class.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { accesses: { some: { userId: user.id } } }
      ]
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true }
  });

  return NextResponse.json({ ok:true, classes });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const body = await req.json().catch(()=> ({}));
  const name = (body?.name ?? "").toString().trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ ok:false, error: "Nome da turma inválido" }, { status: 400 });
  }

  const cls = await prisma.class.create({
    data: {
      name,
      ownerId: user.id,
      accesses: {
        create: {
          userId: user.id,
          role: "PROFESSOR"
        }
      }
    },
    select: { id: true, name: true, createdAt: true }
  });

  return NextResponse.json({ ok:true, class: cls }, { status: 201 });
}
