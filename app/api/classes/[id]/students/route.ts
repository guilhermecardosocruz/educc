import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// trata string vazia como undefined
const emptyToUndef = z.string().transform(v => v.trim()).transform(v => v.length ? v : undefined).optional();

const createSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  cpf: emptyToUndef,
  contact: emptyToUndef,
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
const students = await prisma.student.findMany({
    where: { classId: id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, cpf: true, contact: true },
  });

  return NextResponse.json({ ok: true, students });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });
const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, cpf, contact } = parsed.data;

  try {
    const student = await prisma.student.create({
      data: {
        name,
        classId: id,
        ...(cpf ? { cpf } : {}),
        ...(contact ? { contact } : {}),
      },
      select: { id: true, name: true, cpf: true, contact: true },
    });
    return NextResponse.json({ ok: true, student }, { status: 201 });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json({ ok: false, error: "Conflito de valor único (já existe)." }, { status: 409 });
      }
      if (err.code === "P2003") {
        return NextResponse.json({ ok: false, error: "Falha de integridade referencial." }, { status: 400 });
      }
    }
    console.error("POST /students error:", err);
    return NextResponse.json({ ok: false, error: "Erro interno ao criar aluno." }, { status: 500 });
  }
}
