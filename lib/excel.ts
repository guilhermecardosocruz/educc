import * as XLSX from "xlsx";

export type UploadStudent = {
  aluno_nome: string;
  aluno_doc?: string;
  turma?: string;
  carga_horaria?: string;
  observacoes?: string;
};

export function buildStudentsTemplateWorkbook(): XLSX.WorkBook {
  const headers = ["aluno_nome","aluno_doc","turma","carga_horaria","observacoes"];
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "alunos");
  return wb;
}

export function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as any);
}

export async function parseStudentsFromArrayBuffer(ab: ArrayBuffer): Promise<UploadStudent[]> {
  const wb = XLSX.read(ab, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  const normalized = rows.map((r) => {
    const aluno_nome = String(
      r.aluno_nome ?? r["aluno_nome"] ?? r["nome"] ?? ""
    ).trim();

    const obj: UploadStudent = {
      aluno_nome,
      aluno_doc: String(r.aluno_doc ?? "").trim() || undefined,
      turma: String(r.turma ?? "").trim() || undefined,
      carga_horaria: String(r.carga_horaria ?? "").trim() || undefined,
      observacoes: String(r.observacoes ?? "").trim() || undefined,
    };
    return obj;
  }).filter(x => x.aluno_nome);

  return normalized;
}
