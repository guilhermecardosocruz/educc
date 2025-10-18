import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

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

/** quebra texto por palavras respeitando largura máxima */
function wrapTextByWidth({
  text,
  font,
  size,
  maxWidth,
}: { text: string; font: PDFFont; size: number; maxWidth: number }): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const test = line ? line + " " + w : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      // se palavra sozinha já excede, força quebra dura
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        // quebra a palavra em pedaços aproximados
        let chunk = "";
        for (const ch of w) {
          const t2 = chunk + ch;
          if (font.widthOfTextAtSize(t2, size) <= maxWidth) {
            chunk = t2;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        line = chunk;
      } else {
        line = w;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildCertificatesPDF(ev: EventPayload, alunos: Student[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const st of alunos) {
    if (!st?.aluno_nome) continue;

    // A4 paisagem
    const page = pdf.addPage([842, 595]);
    const { width, height } = page.getSize();

    const margin = 30;
    const contentX = margin + 30;
    const contentWidth = width - (contentX + margin + 30);
    let y = height - 80;

    // moldura
    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - margin * 2,
      height: height - margin * 2,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // título centralizado
    const title = "CERTIFICADO";
    const titleSize = 26;
    const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y,
      size: titleSize,
      font: fontBold,
    });
    y -= 36;

    const periodo =
      ev.data_inicio || ev.data_fim
        ? `${ev.data_inicio ?? ""}${ev.data_inicio && ev.data_fim ? " a " : ""}${ev.data_fim ?? ""}`
        : "";
    const carga = st.carga_horaria || ev.carga_horaria || "";

    // texto principal com wrap
    const linhas: string[] = [];
    linhas.push(`Certificamos que ${st.aluno_nome} participou do evento "${ev.nome}"`);
    if (periodo) linhas.push(`realizado no período de ${periodo}`);
    if (carga) linhas.push(`com carga horária de ${carga}.`);
    const corpo = linhas.join(", ") + (linhas.length ? "" : ".");

    const bodySize = 14;
    const bodyLH = 18;
    const bodyLines = wrapTextByWidth({ text: corpo, font, size: bodySize, maxWidth: contentWidth });

    for (const line of bodyLines) {
      page.drawText(line, { x: contentX, y, size: bodySize, font });
      y -= bodyLH;
    }

    // espaço para assinaturas ou selo (opcional)
    y -= 24;

    // rodapé
    const footSize = 10;
    const g = (t: string) => page.drawText(t, { x: contentX, y, size: footSize, font, color: rgb(0.2, 0.2, 0.2) });
    if (ev.local) { g(`Local: ${ev.local}`); y -= 14; }
    if (ev.responsavel) { g(`Responsável: ${ev.responsavel}`); y -= 14; }
  }

  return await pdf.save();
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    const validos = Array.isArray(alunos) ? alunos.filter((a) => a?.aluno_nome) : [];
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
