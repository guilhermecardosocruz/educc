import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";
import { z } from "zod";

/** Serialização do bodyHtml em seções e vice-versa */
function toBodyHtml(obj: {objetivos?: string; desenvolvimento?: string; recursos?: string; bncc?: string}) {
  const b = [];
  if (obj.objetivos) b.push(`<h3>Objetivos</h3><p>${obj.objetivos}</p>`);
  if (obj.desenvolvimento) b.push(`<h3>Desenvolvimento das Atividades</h3><p>${obj.desenvolvimento}</p>`);
  if (obj.recursos) b.push(`<h3>Recursos Pedagógicos</h3><p>${obj.recursos}</p>`);
  if (obj.bncc) b.push(`<h3>BNCC</h3><p>${obj.bncc}</p>`);
  return b.join("\n");
}

function fromBodyHtml(html?: string) {
  const out: Record<string,string> = {};
  if (!html) return out;
  const get = (title: string) => {
    const re = new RegExp(`<h3>\\s*${title}\\s*<\\/h3>\\s*<p>([\\s\\S]*?)<\\/p>`, "i");
    const m = html.match(re);
    return m ? m[1] : "";
  };
  out.objetivos = get("Objetivos");
  out.desenvolvimento = get("Desenvolvimento das Atividades");
  out.recursos = get("Recursos Pedagógicos");
  out.bncc = get("BNCC");
  return out;
}

const patchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  objetivos: z.string().optional(),
  desenvolvimento: z.string().optional(),
  recursos: z.string().optional(),
  bncc: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });

  const content = await prisma.content.findFirst({
    where: { classId: id, seq: Number(seq) },
    select: { id:true, seq:true, title:true, bodyHtml:true }
  });
  if (!content) return NextResponse.json({ ok:false, error:"Conteúdo não encontrado" }, { status:404 });

  const sections = fromBodyHtml(content.bodyHtml || "");
  return NextResponse.json({ ok:true, content: { ...content, ...sections } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });

  const body = await req.json().catch(()=> ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status:400 });

  const current = await prisma.content.findFirst({
    where: { classId: id, seq: Number(seq) },
    select: { id:true, title:true, bodyHtml:true, seq:true }
  });
  if (!current) return NextResponse.json({ ok:false, error:"Conteúdo não encontrado" }, { status:404 });

  const existing = fromBodyHtml(current.bodyHtml || "");
  const merged = {
    objetivos: parsed.data.objetivos ?? existing.objetivos ?? "",
    desenvolvimento: parsed.data.desenvolvimento ?? existing.desenvolvimento ?? "",
    recursos: parsed.data.recursos ?? existing.recursos ?? "",
    bncc: parsed.data.bncc ?? existing.bncc ?? "",
  };

  const updated = await prisma.content.update({
    where: { id: current.id },
    data: {
      title: parsed.data.title ?? current.title,
      bodyHtml: toBodyHtml(merged),
    },
    select: { id:true, seq:true, title:true, bodyHtml:true }
  });

  return NextResponse.json({ ok:true, content: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });

  const content = await prisma.content.findFirst({ where: { classId: id, seq: Number(seq) }, select: { id:true } });
  if (!content) return NextResponse.json({ ok:false, error:"Conteúdo não encontrado" }, { status:404 });

  await prisma.content.delete({ where: { id: content.id } });
  return NextResponse.json({ ok:true });
}
