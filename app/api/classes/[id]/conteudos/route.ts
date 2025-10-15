import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";
import { z } from "zod";

// Monta um HTML simples com as seções opcionais
function toBodyHtml(obj: {objetivos?: string; desenvolvimento?: string; recursos?: string; bncc?: string}) {
  const b = [];
  if (obj.objetivos) b.push(`<h3>Objetivos</h3><p>${obj.objetivos}</p>`);
  if (obj.desenvolvimento) b.push(`<h3>Desenvolvimento das Atividades</h3><p>${obj.desenvolvimento}</p>`);
  if (obj.recursos) b.push(`<h3>Recursos Pedagógicos</h3><p>${obj.recursos}</p>`);
  if (obj.bncc) b.push(`<h3>BNCC</h3><p>${obj.bncc}</p>`);
  return b.join("\n");
}

const createSchema = z.object({
  title: z.string().trim().min(2, "Nome da aula é obrigatório"),
  objetivos: z.string().optional(),
  desenvolvimento: z.string().optional(),
  recursos: z.string().optional(),
  bncc: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const list = await prisma.content.findMany({
    where: { classId: id },
    orderBy: { seq: "asc" },
    select: { id: true, seq: true, title: true }
  });

  return NextResponse.json({ ok:true, list });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });

  const body = await req.json().catch(()=> ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const last = await prisma.content.findFirst({ where: { classId: id }, orderBy: { seq: "desc" }, select: { seq: true } });
  const nextSeq = (last?.seq ?? 0) + 1;

  const created = await prisma.content.create({
    data: {
      classId: id,
      seq: nextSeq,
      title: parsed.data.title,
      bodyHtml: toBodyHtml(parsed.data),
    },
    select: { id: true, seq: true, title: true }
  });

  return NextResponse.json({ ok:true, content: created }, { status: 201 });
}
