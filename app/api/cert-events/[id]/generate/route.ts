import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, EmbedPNGOptions, EmbeddedPage } from "pdf-lib";

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
  cidade_uf?: string; // ex.: "Criciúma (SC)"
  data_cidade_personalizada?: string; // ex.: "Criciúma (SC), 19 de agosto de 2025."
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
  const words = (text || "").trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const test = line ? line + " " + w : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      // palavra muito longa: quebra em pedaços
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
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

/** centraliza uma string com base na largura do texto */
function drawCenteredText(page: any, text: string, y: number, size: number, font: PDFFont, color = rgb(0,0,0)) {
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (width - textWidth) / 2, y, size, font, color });
}

/** direita: calcula x para alinhar à direita respeitando margem */
function drawRightAlignedText(page: any, text: string, y: number, size: number, font: PDFFont, rightMargin: number, color = rgb(0,0,0)) {
  const { width } = page.getSize();
  const textWidth = font.widthOfTextAtSize(text, size);
  const x = Math.max(0, width - rightMargin - textWidth);
  page.drawText(text, { x, y, size, font, color });
}

/** formata data pt-BR "19 de agosto de 2025" a partir de "YYYY-MM-DD" */
function formatPtBrDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  // normaliza "19 de agosto de 2025"
  const parts = fmt.formatToParts(d);
  const dia = parts.find(p => p.type === "day")?.value ?? "";
  const mes = parts.find(p => p.type === "month")?.value ?? "";
  const ano = parts.find(p => p.type === "year")?.value ?? "";
  return `${dia} de ${mes} de ${ano}`;
}

/** bloco de assinaturas: três colunas com linha e legenda */
function drawSignaturesBlock(page: any, font: PDFFont, fontBold: PDFFont, opts: {
  y: number;
  leftMargin: number;
  rightMargin: number;
  titles: { name: string; role: string }[];
}) {
  const { width } = page.getSize();
  const { y, leftMargin, rightMargin, titles } = opts;
  const usableWidth = width - leftMargin - rightMargin;
  const cols = titles.length;
  const colW = usableWidth / cols;
  const lineY = y;
  const nameY = y - 14;
  const roleY = y - 28;

  for (let i = 0; i < cols; i++) {
    const x0 = leftMargin + i * colW + 10;
    const x1 = leftMargin + (i + 1) * colW - 10;

    // linha
    page.drawLine({ start: { x: x0, y: lineY }, end: { x: x1, y: lineY }, thickness: 1, color: rgb(0,0,0) });

    // nome (negrito) e cargo
    const centerX = (x0 + x1) / 2;
    const nameSize = 10;
    const roleSize = 9;
    const name = titles[i].name;
    const role = titles[i].role;

    const nameWidth = fontBold.widthOfTextAtSize(name, nameSize);
    const roleWidth = font.widthOfTextAtSize(role, roleSize);
    page.drawText(name, { x: centerX - nameWidth / 2, y: nameY, size: nameSize, font: fontBold });
    page.drawText(role, { x: centerX - roleWidth / 2, y: roleY, size: roleSize, font });
  }
}

async function buildCertificatesPDF(ev: EventPayload, alunos: Student[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // cores inspiradas no modelo
  const red = rgb(0.80, 0.00, 0.00);
  const green = rgb(0.00, 0.45, 0.30);
  const gray = rgb(0.25, 0.25, 0.25);

  for (const st of alunos) {
    if (!st?.aluno_nome) continue;

    // A4 paisagem
    const page = pdf.addPage([842, 595]);
    const { width, height } = page.getSize();

    const margin = 36;
    const left = margin;
    const right = margin;
    const contentX = left + 24;
    const contentWidth = width - (contentX + right + 24);
    let y = height - 72;

    // Moldura leve
    page.drawRectangle({
      x: margin / 2,
      y: margin / 2,
      width: width - margin,
      height: height - margin,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 0.8,
      opacity: 1
    });

    // Elementos decorativos simples no canto superior direito (triângulos)
    page.drawRectangle({ x: width - 140, y: height - 40, width: 140, height: 40, color: red });
    page.drawRectangle({ x: width - 95, y: height - 70, width: 95, height: 30, color: green });

    // Título "CERTIFICADO" centralizado em vermelho
    drawCenteredText(page, "CERTIFICADO", y, 28, fontBold, red);
    y -= 44;

    // Linha do nome centralizada (NOME e DOC)
    const nomeLinha = [st.aluno_nome, st.aluno_doc ? `- ${st.aluno_doc}` : ""].filter(Boolean).join(" ");
    drawCenteredText(page, nomeLinha, y, 14, fontBold, rgb(0,0,0));
    y -= 28;

    // Período e carga
    const periodo =
      ev.data_inicio || ev.data_fim
        ? `${ev.data_inicio ?? ""}${ev.data_inicio && ev.data_fim ? " a " : ""}${ev.data_fim ?? ""}`
        : "";
    const carga = st.carga_horaria || ev.carga_horaria || "";

    // Corpo do texto com o nome do curso (ev.nome) em destaque
    // Estratégia: dividir em partes para simular negrito no título do curso
    // “participou do Curso WORKSHOP..., promovido..., realizado em..., com carga horária...”
    const intro = "participou do Curso ";
    const curso = ev.nome || "Curso";
    const pos = [];

    const corpoBase: string[] = [];
    // intro + curso em caixa alta (para destacar)
    corpoBase.push(`${intro}${curso.toUpperCase()},`);
    corpoBase.push("promovido e organizado pela Escola Municipal de Governo de Criciúma,");
    if (periodo) corpoBase.push(`realizado no período de ${periodo},`);
    if (carga)  corpoBase.push(`com carga horária de ${carga}.`);

    // Renderização do parágrafo (wrap por largura)
    const bodySize = 12.5;
    const bodyLH = 17;
    const paragraph = corpoBase.join(" ");
    const bodyLines = wrapTextByWidth({ text: paragraph, font, size: bodySize, maxWidth: contentWidth });
    for (const line of bodyLines) {
      page.drawText(line, { x: contentX, y, size: bodySize, font, color: rgb(0,0,0) });
      y -= bodyLH;
    }

    // Espaço
    y -= 20;

    // Data/lugar — à direita
    const dataTextoCustom = ev.data_cidade_personalizada?.trim();
    const dataFormatada = formatPtBrDate(ev.data_fim || ev.data_inicio);
    const cidade = ev.cidade_uf?.trim() || ev.local?.trim();
    const linhaData = dataTextoCustom
      ? dataTextoCustom
      : (cidade && dataFormatada ? `${cidade}, ${dataFormatada}.` : (dataFormatada ? `${dataFormatada}.` : ""));
    if (linhaData) {
      drawRightAlignedText(page, linhaData, y, 12, font, right, gray);
      y -= 28;
    } else {
      y -= 10;
    }

    // Bloco de assinaturas (3 colunas): Prefeito, Secretária de Educação, Participante
    const signY = 120;
    drawSignaturesBlock(page, font, fontBold, {
      y: signY,
      leftMargin: left,
      rightMargin: right,
      titles: [
        { name: "VÁGNER ESPÍNDOLA RODRIGUES", role: "Prefeito Municipal" },
        { name: "GEÓVANA BENEDET ZANETTE", role: "Secretária Municipal de Educação" },
        { name: (st.aluno_nome || "Participante").toUpperCase(), role: "Participante" },
      ],
    });
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
