import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const dynamic = "force-dynamic";

type EventPayload = {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  local?: string;
  carga_horaria?: string;
  responsavel?: string;
};
type Student = {
  aluno_nome: string;
  aluno_doc?: string;
  turma?: string;
  carga_horaria?: string;
  observacoes?: string;
};

async function buildCertificatesPDF(ev: EventPayload, alunos: Student[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const st of alunos) {
    if (!st?.aluno_nome) continue;

    const page = pdf.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Moldura
    page.drawRectangle({
      x: 30, y: 30, width: width - 60, height: height - 60, borderColor: rgb(0,0,0), borderWidth: 1
    });

    // Título
    page.drawText("CERTIFICADO", { x: 185, y: height - 120, size: 24, font: fontBold });

    // Corpo
    const nomeAluno = st.aluno_nome;
    const evento = ev.nome;
    const carga = st.carga_horaria || ev.carga_horaria || "";
    const periodo = (ev.data_inicio || ev.data_fim)
      ? `${ev.data_inicio ?? ""}${ev.data_inicio && ev.data_fim ? " a " : ""}${ev.data_fim ?? ""}`
      : "";

    const linhas: string[] = [];
    linhas.push(`Certificamos que ${nomeAluno} participou do evento "${evento}"`);
    if (periodo) linhas.push(`realizado no período de ${periodo}`);
    if (carga) linhas.push(`com carga horária de ${carga}.`);
    const corpo = linhas.join(", ");

    page.drawText(corpo, { x: 60, y: height - 180, size: 12, font, lineHeight: 16 });

    // Rodapé
    const local = ev.local ? `Local: ${ev.local}` : "";
    const resp = ev.responsavel ? `Responsável: ${ev.responsavel}` : "";
    page.drawText(local, { x: 60, y: 120, size: 10, font, color: rgb(0.2,0.2,0.2) });
    page.drawText(resp,  { x: 60, y: 100, size: 10, font, color: rgb(0.2,0.2,0.2) });
  }

  return await pdf.save();
}

export async function POST(req: Request, { params }: { params: { id: string }}) {
  try {
    const body = await req.json().catch(() => ({}));
    const ev: EventPayload = body?.event;
    const alunos: Student[] = body?.students || [];

    if (!ev?.id || ev.id !== params.id) {
      return NextResponse.json({ ok: false, error: "Evento inválido" }, { status: 400 });
    }
    if (!ev?.nome) {
      return NextResponse.json({ ok: false, error: "Nome do evento é obrigatório" }, { status: 400 });
    }
    const validos = Array.isArray(alunos) ? alunos.filter(a => a?.aluno_nome) : [];
    if (validos.length === 0) {
      return NextResponse.json({ ok: false, error: "Nenhum aluno válido fornecido" }, { status: 400 });
    }

    const pdfBytes = await buildCertificatesPDF(ev, validos);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificados-${params.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Falha ao gerar certificados" }, { status: 500 });
  }
}
