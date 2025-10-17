import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ClassSummary } from "@/lib/analytics/attendance";

export async function buildGroupReportPDF({
  groupName,
  from,
  to,
  summaries,
}: {
  groupName: string;
  from: string;
  to: string;
  summaries: ClassSummary[];
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();

  const pageMargin = 50;
  const pageWidth = 595.28;   // A4 width in points
  const pageHeight = 841.89;  // A4 height in points

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - pageMargin;

  const lineHeight = 14;
  const sectionGap = 10;

  function drawText(text: string, opts?: { bold?: boolean; size?: number; color?: { r:number; g:number; b:number } }) {
    const size = opts?.size ?? 11;
    const font = opts?.bold ? fontBold : fontRegular;
    const color = opts?.color ? rgb(opts.color.r, opts.color.g, opts.color.b) : rgb(0, 0, 0);

    // quebra de página simples
    if (y - size < pageMargin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - pageMargin;
    }

    page.drawText(text, { x: pageMargin, y: y - size, size, font, color });
    y -= (size + 4);
  }

  function drawDivider() {
    // quebra de página simples
    if (y - 8 < pageMargin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - pageMargin;
    }
    page.drawLine({
      start: { x: pageMargin, y: y - 4 },
      end: { x: pageWidth - pageMargin, y: y - 4 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    y -= 10;
  }

  // Cabeçalho
  drawText(`Relatório de Presenças — Grupo: ${groupName}`, { bold: true, size: 16 });
  drawText(`Período: ${from} a ${to}`, { size: 10, color: { r: 0.33, g: 0.33, b: 0.33 } });
  y -= sectionGap;

  if (!summaries.length) {
    drawText("Não há turmas vinculadas a este grupo no período informado.", { size: 11 });
  }

  for (const s of summaries) {
    drawText(`Turma: ${s.className}`, { bold: true, size: 13 });
    drawText(`Aulas no período: ${s.lessonsCount}`, { size: 11, color: { r: 0.2, g: 0.2, b: 0.2 } });
    drawText(`Média de presentes (abs.): ${s.avgPresentAbsolute}`, { size: 11, color: { r: 0.2, g: 0.2, b: 0.2 } });
    drawText(`Média de presença (%): ${s.avgPresentPercent}%`, { size: 11, color: { r: 0.2, g: 0.2, b: 0.2 } });

    y -= 4;
    drawText("Top 5 mais faltantes:", { bold: true, size: 12 });

    if (!s.topAbsentees.length) {
      drawText("— Sem dados de faltas no período.", { size: 11, color: { r: 0.35, g: 0.35, b: 0.35 } });
    } else {
      let rank = 1;
      for (const st of s.topAbsentees) {
        drawText(`${rank}. ${st.name} — ${st.absences} falta(s)`, { size: 11 });
        rank += 1;
      }
    }

    y -= sectionGap;
    drawDivider();
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
