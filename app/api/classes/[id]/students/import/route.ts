import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// Garantir Node.js (xlsx não roda no edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Row = { name?: string; cpf?: string; contact?: string };

function norm(h: string) {
  return h
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

async function parseCSV(file: File): Promise<Row[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return [];
  const headers = lines[0].split(/[,;|\t]/).map(norm);
  const out: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;|\t]/);
    const row: any = {};
    headers.forEach((h, idx) => {
      const v = (cols[idx] ?? "").toString().trim();
      if (h === "name" || h === "nome") row.name = v;
      else if (h === "cpf") row.cpf = v;
      else if (h === "contact" || h === "contato" || h === "telefone" || h === "whatsapp") row.contact = v;
    });
    out.push(row);
  }
  return out;
}

async function parseXLSX(file: File): Promise<Row[]> {
  const ab = await file.arrayBuffer();
  const XLSX = await import("xlsx");
  const wb = XLSX.read(ab, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
  return json.map((r) => {
    const map: any = {};
    for (const k of Object.keys(r)) {
      const nk = norm(k);
      map[nk] = r[k];
    }
    const row: Row = {};
    row.name = (map["name"] ?? map["nome"] ?? "").toString().trim();
    row.cpf = (map["cpf"] ?? "").toString().trim();
    row.contact = (map["contact"] ?? map["contato"] ?? map["telefone"] ?? map["whatsapp"] ?? "").toString().trim();
    return row;
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  if (!file) return NextResponse.json({ ok: false, error: "Arquivo não enviado (campo 'file')." }, { status: 400 });

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });
  if (!cls) return NextResponse.json({ ok: false, error: "Turma não encontrada." }, { status: 404 });

  try {
    const mime = (file.type || "").toLowerCase();
    const name = (file as any).name ? String((file as any).name).toLowerCase() : "";

    let rows: Row[] = [];

    // 1) CSV explícito por MIME ou extensão
    const looksCSV = mime.includes("csv") || name.endsWith(".csv");
    // 2) XLSX explícito por MIME ou extensão
    const looksXLSX = mime.includes("spreadsheet") || mime.includes("excel") || name.endsWith(".xlsx");

    if (looksXLSX) {
      rows = await parseXLSX(file);
    } else if (looksCSV) {
      rows = await parseCSV(file);
    } else {
      // Caso incerto (sem name e sem MIME confiável): tenta XLSX primeiro e cai pra CSV
      try {
        rows = await parseXLSX(file);
      } catch {
        rows = await parseCSV(file);
      }
    }

    const toInsert = rows
      .map(r => ({
        name: (r.name ?? "").toString().trim(),
        cpf: (r.cpf ?? "").toString().trim(),
        contact: (r.contact ?? "").toString().trim(),
      }))
      .filter(r => r.name.length > 0);

    if (!toInsert.length) {
      return NextResponse.json({ ok: false, error: "Planilha sem linhas válidas. A coluna 'name' é obrigatória." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      for (const r of toInsert) {
        await tx.student.create({
          data: {
            classId: id,
            name: r.name,
            ...(r.cpf ? { cpf: r.cpf } : {}),
            ...(r.contact ? { contact: r.contact } : {}),
          },
        });
      }
    });

    return NextResponse.json({ ok: true, inserted: toInsert.length });
  } catch (e: any) {
    console.error("IMPORT students error:", e);
    const msg = e?.message || "Falha ao processar a planilha.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
