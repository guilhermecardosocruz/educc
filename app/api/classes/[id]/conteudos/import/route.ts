import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// CSV simples (com aspas) -> objetos
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

function toBodyHtml(obj: {objetivos?: string; desenvolvimento?: string; recursos?: string; bncc?: string}) {
  const b = [];
  if (obj.objetivos) b.push(`<h3>Objetivos</h3><p>${obj.objetivos}</p>`);
  if (obj.desenvolvimento) b.push(`<h3>Desenvolvimento das Atividades</h3><p>${obj.desenvolvimento}</p>`);
  if (obj.recursos) b.push(`<h3>Recursos Pedagógicos</h3><p>${obj.recursos}</p>`);
  if (obj.bncc) b.push(`<h3>BNCC</h3><p>${obj.bncc}</p>`);
  return b.join("\n");
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true } });
  if (!cls) return NextResponse.json({ ok:false, error: "Turma não encontrada" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ ok:false, error: "Arquivo ausente" }, { status: 400 });

  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".xlsx")) {
    // Para suportar XLSX, adicione a lib "xlsx" e faça o parse aqui.
    // Ex.: const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
    // Por ora, retornamos instrução amigável:
    return NextResponse.json({
      ok:false,
      error:"XLSX ainda não habilitado no servidor. Envie CSV ou instale a dependência 'xlsx' e habilite o parser."
    }, { status: 415 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length === 0) return NextResponse.json({ ok:false, error: "Planilha vazia ou inválida" }, { status: 400 });

  // Campos aceitos: Nome da aula (obrigatório), objetivos, desenvolvimento das atividades, recursos pedagógicos, BNCC
  // Cabeçalhos esperados (case-insensitive): "nome da aula" | "aula" | "título", "objetivos", "desenvolvimento das atividades", "recursos pedagógicos", "bncc"
  const norm = (s:string) => s.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().trim();

  let created = 0, updated = 0;

  await prisma.$transaction(async (tx) => {
    // define seq auto pelo maior existente
    let last = await tx.content.findFirst({ where: { classId: id }, orderBy: { seq: "desc" }, select: { seq: true } });
    let seq = (last?.seq ?? 0);

    for (const r of rows) {
      const keys = Object.fromEntries(Object.keys(r).map(k => [norm(k), k]));
      const title = (r[keys[norm("nome da aula")] ?? keys["titulo"] ?? keys["aula"]] ?? "").toString().trim();
      if (!title) continue;

      const objetivos = (r[keys["objetivos"]] ?? "").toString().trim();
      const desenvolvimento = (r[keys[norm("desenvolvimento das atividades")]] ?? "").toString().trim();
      const recursos = (r[keys[norm("recursos pedagogicos")]] ?? "").toString().trim();
      const bncc = (r[keys["bncc"]] ?? "").toString().trim();

      seq += 1;

      await tx.content.create({
        data: {
          classId: id,
          seq,
          title,
          bodyHtml: toBodyHtml({ objetivos, desenvolvimento, recursos, bncc })
        }
      });
      created++;
    }
  });

  return NextResponse.json({ ok:true, created, updated });
}
