import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

function parseCsv(text: string): Record<string,string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map(h => h.trim());
  const rows: Record<string,string>[] = [];
  for (let i=1;i<lines.length;i++){
    const raw = lines[i];
    const cells: string[] = [];
    let cur = "", inside = false;
    for (let j=0;j<raw.length;j++){
      const ch = raw[j];
      if (ch === '"') { inside = !inside; continue; }
      if (ch === ',' && !inside) { cells.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur);
    const obj: Record<string,string> = {};
    header.forEach((h, idx) => obj[h] = (cells[idx] ?? "").trim());
    rows.push(obj);
  }
  return rows;
}

export const POST = async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });
  if (!cls) return NextResponse.json({ ok:false, error: "Turma não encontrada" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ ok:false, error: "Arquivo ausente" }, { status: 400 });

  const ctype = (file.type || "").toLowerCase();

  // CSV por enquanto; XLSX retorna 415
  if (ctype.includes("spreadsheetml")) {
    return NextResponse.json({ ok:false, error: "XLSX ainda não suportado. Exporte para CSV." }, { status: 415 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return NextResponse.json({ ok:false, error: "Planilha vazia ou inválida" }, { status: 400 });
  }

  // Cabeçalhos esperados:
  // Aula, Título, Conteúdo da Aula, Objetivos, Desenvolvimento das Atividades, Recursos Didáticos, BNCC
  const normalize = (s: string) => s?.trim() || "";
  let created = 0, updated = 0;

  await prisma.$transaction(async (tx) => {
    for (const r of rows) {
      const aula = Number((r["Aula"] ?? r["aula"] ?? "").toString().trim());
      if (!Number.isFinite(aula)) continue;

      const title = normalize(r["Título"] ?? r["Titulo"] ?? r["titulo"] ?? r["title"] ?? `Conteúdo ${aula}`);
      const bodyParts = [
        ["Conteúdo da Aula", r["Conteúdo da Aula"]],
        ["Objetivos", r["Objetivos"]],
        ["Desenvolvimento das Atividades", r["Desenvolvimento das Atividades"]],
        ["Recursos Didáticos", r["Recursos Didáticos"]],
        ["BNCC", r["BNCC"]],
      ].filter(([,v]) => (v ?? "").toString().trim().length > 0);

      const bodyHtml = bodyParts.map(([label, val]) =>
        `<h3>${label}</h3><p>${(val ?? "").toString().trim()}</p>`
      ).join("\n");

      const before = await tx.content.findUnique({
        where: { classId_seq: { classId: id, seq: aula } },
        select: { id: true }
      });

      if (before) {
        await tx.content.update({
          where: { classId_seq: { classId: id, seq: aula } },
          data: { title, bodyHtml }
        });
        updated++;
      } else {
        await tx.content.create({
          data: { classId: id, seq: aula, title, bodyHtml }
        });
        created++;
      }
    }
  });

  return NextResponse.json({ ok:true, created, updated });
};
