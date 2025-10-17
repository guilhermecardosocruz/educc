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
  const { default: PDFDocument } = await import("pdfkit");

  const doc = new PDFDocument({ margin: 50 });
  const chunks: Buffer[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    doc.fontSize(16).text(`Relatório de Presenças — Grupo: ${groupName}`, { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555").text(`Período: ${from} a ${to}`);
    doc.moveDown();

    summaries.forEach((s, idx) => {
      if (idx > 0) doc.moveDown(0.5);
      doc.fillColor("#000").fontSize(13).text(`Turma: ${s.className}`);
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor("#333")
        .text(`Aulas no período: ${s.lessonsCount}`)
        .text(`Média de presentes (abs.): ${s.avgPresentAbsolute}`)
        .text(`Média de presença (%): ${s.avgPresentPercent}%`);
      doc.moveDown(0.4);
      doc.fontSize(11).fillColor("#000").text("Top 5 mais faltantes:");
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor("#333");
      if (s.topAbsentees.length === 0) {
        doc.text("— Sem dados de faltas no período.");
      } else {
        s.topAbsentees.forEach((st, i) => {
          doc.text(`${i + 1}. ${st.name} — ${st.absences} falta(s)`);
        });
      }
      doc.moveDown();
      const x = doc.x;
      const y = doc.y;
      doc.moveTo(x, y).lineTo(545, y).strokeColor("#ddd").stroke();
    });

    doc.end();
  });
}
