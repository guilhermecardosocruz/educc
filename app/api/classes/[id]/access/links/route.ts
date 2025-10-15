import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  role: z.enum(["PROFESSOR", "GESTOR"]),
  note: z.string().max(200).optional(),
  promotional: z.boolean().optional(), // se true e role=PROFESSOR, ativa promo automática
});

const revokeSchema = z.object({
  linkId: z.string().min(1),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  // GET liberado para PROFESSOR e GESTOR
  const role = await getRole(user.id, id);
  if (!role) return NextResponse.json({ ok:false, error:"Sem acesso" }, { status: 403 });

  const rows = await prisma.shareLink.findMany({
    where: { classId: id, isRevoked: false },
    orderBy: { createdAt: "desc" },
    select: { id:true, token:true, role:true, createdAt:true, createdBy:true, isPromotional:true }
  });

  return NextResponse.json({ ok:true, links: rows });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  // Apenas PROFESSOR cria/gera link
  const role = await getRole(user.id, id);
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });

  const body = await req.json().catch(()=> ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const token = crypto.randomUUID().replace(/-/g, "");
  const created = await prisma.shareLink.create({
    data: {
      classId: id,
      token,
      role: parsed.data.role,
      createdBy: user.id,
      isPromotional: !!parsed.data.promotional && parsed.data.role === "PROFESSOR",
    },
    select: { id:true, token:true, role:true, createdAt:true, createdBy:true, isPromotional:true }
  });

  await logAudit(id, "LINK_CREATED", {
    actorId: user.id,
    metadata: { linkId: created.id, role: created.role, promotional: created.isPromotional }
  });

  return NextResponse.json({ ok:true, link: created }, { status: 201 });
}

// Revogar (equivale a "rotacionar": você cria outro e revoga este)
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  // Apenas PROFESSOR pode revogar
  const role = await getRole(user.id, id);
  if (role !== "PROFESSOR") return NextResponse.json({ ok:false, error:"Apenas professor pode alterar" }, { status: 403 });

  const body = await req.json().catch(()=> ({}));
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok:false, error: parsed.error.flatten() }, { status: 400 });

  const link = await prisma.shareLink.findFirst({
    where: { id: parsed.data.linkId, classId: id, isRevoked: false },
    select: { id:true }
  });
  if (!link) return NextResponse.json({ ok:false, error:"Link não encontrado" }, { status: 404 });

  await prisma.shareLink.update({
    where: { id: link.id },
    data: { isRevoked: true }
  });

  await logAudit(id, "LINK_REVOKED", {
    actorId: user.id,
    metadata: { linkId: link.id }
  });

  return NextResponse.json({ ok:true });
}
