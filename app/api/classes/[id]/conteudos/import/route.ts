import { NextResponse } from "next/server";
export const runtime = "nodejs";

// import { prisma } from "@/lib/prisma"; // se for usar DB, descomente e adapte

async function parseXLSX(buf: Buffer) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
  return rows;
}

function parseCSV(text: string) {
  const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
  if (!lines.length) return [];
  const headers = lines.shift()!.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.map(l => {
    const cols = l.split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });
}

// ⚠️ Sem tipagem rígida no 2º arg para compatibilidade com o validador do Next 15.
export async function POST(req: Request, ctx: any) {
  const { params } = (ctx || {}) as { params?: { id?: string } };
  const classId = params?.id ?? "";

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ ok:false, message:"Arquivo não enviado." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();

  const isCSV = name.endsWith(".csv") || type.includes("text/csv");
  const isXLSX = name.endsWith(".xlsx") || name.endsWith(".xls") || type.includes("sheet") || type.includes("ms-excel");

  try {
    let rows: Record<string, any>[] = [];
    if (isCSV) rows = parseCSV(buf.toString("utf8"));
    else if (isXLSX) rows = await parseXLSX(buf);
    else return NextResponse.json({ ok:false, message:"Formato não suportado. Envie CSV ou XLSX." }, { status: 415 });

    const mapped = rows.map(r => ({
      aula: String(r["Aula"] ?? r["aula"] ?? ""),
      titulo: String(r["Título"] ?? r["Titulo"] ?? r["titulo"] ?? ""),
      conteudo: String(r["Conteúdo"] ?? r["Conteudo"] ?? r["conteudo"] ?? ""),
      objetivos: String(r["Objetivos"] ?? r["objetivos"] ?? ""),
      desenvolvimento: String(r["Desenvolvimento"] ?? r["desenvolvimento"] ?? ""),
      recursos: String(r["Recursos"] ?? r["recursos"] ?? ""),
      bncc: String(r["BNCC"] ?? r["bncc"] ?? ""),
    }));

    // // Persistência (exemplo):
    // await prisma.content.createMany({
    //   data: mapped.map(m => ({
    //     classId: classId,
    //     lessonTitle: m.titulo,
    //     content: m.conteudo,
    //     objectives: m.objetivos,
    //     development: m.desenvolvimento,
    //     resources: m.recursos,
    //     bncc: m.bncc,
    //     aula: m.aula,
    //   })),
    //   skipDuplicates: true,
    // });

    return NextResponse.json({ ok:true, count: mapped.length, message:`Import OK: ${mapped.length} linhas` });
  } catch (e: any) {
    return NextResponse.json({ ok:false, message:"Falha ao ler arquivo.", error:String(e?.message || e) }, { status: 500 });
  }
}
