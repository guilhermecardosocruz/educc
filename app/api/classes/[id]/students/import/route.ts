import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parse as parseCsv } from "csv-parse/sync";
import * as XLSX from "xlsx";

export const runtime = "nodejs"; // garante Node API para Buffer

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok:false, error: "Arquivo ausente" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let rows: Array<{ name: string; cpf: string; contact: string }> = [];

  try {
    if (name.endsWith(".csv")) {
      const records = parseCsv(buf.toString("utf-8"), { columns: true, skip_empty_lines: true, trim: true });
      rows = records.map((r:any) => ({ name: String(r.name||"").trim(), cpf: String(r.cpf||"").trim(), contact: String(r.contact||"").trim() }));
    } else if (name.endsWith(".xlsx")) {
      const wb = XLSX.read(buf, { type: "buffer" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
      rows = records.map((r:any) => ({ name: String(r.name||"").trim(), cpf: String(r.cpf||"").trim(), contact: String(r.contact||"").trim() }));
    } else {
      return NextResponse.json({ ok:false, error: "Formato não suportado (use CSV ou XLSX)" }, { status: 400 });
    }
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: "Falha ao ler arquivo: " + (e?.message||"") }, { status: 400 });
  }

  // filtra linhas válidas
  const valid = rows.filter(r => r.name && r.cpf && r.contact);
  if (valid.length === 0) return NextResponse.json({ ok:false, error: "Nenhuma linha válida encontrada" }, { status: 400 });

  const created = await prisma.$transaction(async (tx) => {
    const arr = [];
    for (const r of valid) {
      const st = await tx.student.create({
        data: { classId: id, name: r.name, cpf: r.cpf, contact: r.contact },
        select: { id: true, name: true, cpf: true, contact: true }
      });
      arr.push(st);
    }
    return arr;
  });

  return NextResponse.json({ ok:true, createdCount: created.length, students: created }, { status: 201 });
}
