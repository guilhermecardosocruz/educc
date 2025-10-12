import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const norm = (s:string) => s.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().trim();

async function parseXlsx(file: File): Promise<Record<string,string>[]> {
  const ab = await file.arrayBuffer();
  const XLSX = await import("xlsx");
  const wb = XLSX.read(new Uint8Array(ab), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return json.map((r) => {
    const out: Record<string,string> = {};
    for (const k of Object.keys(r)) out[k] = String(r[k] ?? "").trim();
    return out;
  });
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
  const isXlsx = name.endsWith(".xlsx");
  const isCsv  = name.endsWith(".csv");

  let rows: Record<string,string>[];
  if (isXlsx) {
    rows = await parseXlsx(file);
  } else if (isCsv) {
    rows = parseCsv(await file.text());
  } else {
    try { rows = await parseXlsx(file); }
    catch { rows = parseCsv(await file.text()); }
  }

  if (rows.length === 0) return NextResponse.json({ ok:false, error: "Planilha vazia ou inválida" }, { status: 400 });

  let created = 0;
  await prisma.$transaction(async (tx) => {
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
        data: { classId: id, seq, title, bodyHtml: toBodyHtml({ objetivos, desenvolvimento, recursos, bncc }) }
      });
      created++;
    }
  });

  return NextResponse.json({ ok:true, created, updated: 0 });
}
