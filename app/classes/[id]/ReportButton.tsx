"use client";
import { useEffect, useRef, useState } from "react";

type RankRow = { name: string; faltas: number };

function sanitizeFile(s: string) {
  return s.replace(/[^\p{L}\p{N}_-]+/gu, "_");
}

// Converte o bodyHtml com divisórias e espaçamento extra:
// - 2 quebras entre itens (títulos/paragraphs)
// - remove tags restantes
function htmlToPrettyText(html?: string): string {
  if (!html) return "";
  return html
    .replace(/<h3[^>]*>/gi, "\n\n")   // antes de cada seção
    .replace(/<\/h3>/gi, "\n\n")      // depois do título da seção
    .replace(/<p[^>]*>/gi, "")        // abre parágrafo
    .replace(/<\/p>/gi, "\n\n")       // fecha parágrafo (2 quebras)
    .replace(/<br\s*\/?>/gi, "\n")    // <br>
    .replace(/<[^>]+>/g, "")          // demais tags
    .replace(/\n{3,}/g, "\n\n")       // normaliza excesso
    .trim();
}

export default function ReportButton({ classId, className }: { classId: string; className: string }) {
  const [open, setOpen] = useState<null | "calls" | "contents">(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const jsPdfLoaded = useRef(false);

  useEffect(() => {
    const d = new Date();
    const toIso = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    setEnd(toIso(d));
    setStart(toIso(new Date(d.getFullYear(), d.getMonth() - 1, d.getDate())));
  }, []);

  async function ensureJsPdf() {
    if (jsPdfLoaded.current) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      s.onload = () => {
        jsPdfLoaded.current = true;
        resolve();
      };
      s.onerror = () => reject(new Error("Falha ao carregar jsPDF"));
      document.head.appendChild(s);
    });
  }

  // ------------ Relatório de Chamadas ------------
  async function generateCalls() {
    if (!start || !end) {
      alert("Informe início e fim.");
      return;
    }
    if (start > end) {
      alert("Data inicial não pode ser maior que a final.");
      return;
    }
    setBusy(true);
    try {
      await ensureJsPdf();

      // Alunos
      const stRes = await fetch(`/api/classes/${classId}/students`, { cache: "no-store" });
      const stData = await stRes.json().catch(() => ({}));
      const students: Array<{ id: string; name: string }> =
        stRes.ok && stData?.ok && Array.isArray(stData.students) ? stData.students : [];

      // Chamadas (todas; filtramos por período)
      const chRes = await fetch(`/api/classes/${classId}/chamadas?order=asc`, { cache: "no-store" });
      const chData = await chRes.json().catch(() => ({}));
      const chamadas: Array<{ seq: number; createdAt: string }> =
        chRes.ok && chData?.ok && Array.isArray(chData.attendances) ? chData.attendances : [];

      const onlyDate = (iso: string) => (iso || "").slice(0, 10);
      const periodChamadas = chamadas.filter((c) => {
        const d = onlyDate(c.createdAt);
        return d && d >= start && d <= end;
      });
      const seqs: number[] = periodChamadas.map((c) => c.seq);

      // Presenças por seq
      const presenceBySeq: Record<number, Record<string, boolean>> = {};
      for (const seq of seqs) {
        const prRes = await fetch(`/api/classes/${classId}/chamadas/${seq}/presences`, { cache: "no-store" });
        const prData = await prRes.json().catch(() => ({}));
        const rows: Array<{ studentId: string; present: boolean }> =
          prRes.ok && prData?.ok && Array.isArray(prData.rows) ? prData.rows : [];
        const map: Record<string, boolean> = {};
        for (const r of rows) map[r.studentId] = !!r.present;
        // garante chave para todos
        students.forEach((s) => {
          if (!(s.id in map)) map[s.id] = false;
        });
        presenceBySeq[seq] = map;
      }

      // Métricas e ranking
      const faltas = new Map<string, number>();
      students.forEach((s) => faltas.set(s.id, 0));

      let somaPresentes = 0;
      for (const seq of seqs) {
        const pres = presenceBySeq[seq] || {};
        let presentes = 0;
        students.forEach((s) => {
          if (pres[s.id]) presentes++;
          else faltas.set(s.id, (faltas.get(s.id) || 0) + 1);
        });
        somaPresentes += presentes;
      }

      const totalAlunos = students.length;
      const totalAulas = seqs.length;
      const mediaPresentesAbs = totalAulas ? Math.round((somaPresentes / totalAulas) * 100) / 100 : 0;
      const mediaPercentual =
        totalAulas && totalAlunos ? Math.round((mediaPresentesAbs / totalAlunos) * 10000) / 100 : 0;

      const ranking: RankRow[] = students
        .map<RankRow>((s) => ({ name: s.name, faltas: faltas.get(s.id) || 0 }))
        .sort((a: RankRow, b: RankRow) => b.faltas - a.faltas);

      // @ts-ignore
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Relatório de Chamadas — ${className}`, margin, y);
      y += 24;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Período: ${start} a ${end}`, margin, y);
      y += 24;

      // >>>>>>> NOVO BLOCO (resumo do período) — adicionado sem alterar o restante
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Resumo do período", margin, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total de alunos na turma: ${totalAlunos}`, margin, y); y += 14;
      doc.text(`Média de presentes (abs.): ${mediaPresentesAbs}`, margin, y); y += 14;
      doc.text(`Média de presença (%): ${mediaPercentual}%`, margin, y); y += 20;
      // <<<<<<< FIM DO NOVO BLOCO

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Ranking dos mais faltosos", margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const col1 = margin;
      const col2 = margin + 40;
      const col3 = pageW - margin - 60;

      // Cabeçalho
      doc.setDrawColor(230);
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 12, pageW - margin * 2, 22, "F");
      doc.setFont("helvetica", "bold");
      doc.text("#", col1, y);
      doc.text("Aluno", col2, y);
      doc.text("Faltas", col3, y);
      y += 16;
      doc.setFont("helvetica", "normal");

      const rowH = 16;
      for (let i = 0; i < ranking.length; i++) {
        const r = ranking[i];
        if (y > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(String(i + 1), col1, y);
        const nomeLines = doc.splitTextToSize(r.name, col3 - col2 - 10);
        doc.text(nomeLines, col2, y);
        doc.text(String(r.faltas), col3, y);
        y += rowH + (nomeLines.length - 1) * 10;
      }

      const filename = `Relatorio_Chamadas_${sanitizeFile(className)}_${start}_a_${end}.pdf`;
      // download
      doc.save(filename);
      // abrir em nova aba
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setOpen(null);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Falha ao gerar PDF.");
    } finally {
      setBusy(false);
    }
  }

  // ------------ Relatório de Conteúdos ------------
  async function generateContents() {
    setBusy(true);
    try {
      await ensureJsPdf();

      // Busca com bodyHtml
      const res = await fetch(`/api/classes/${classId}/conteudos/full`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao carregar conteúdos");
      const list: Array<{ seq: number; title: string; bodyHtml?: string | null }> = data.list || [];

      // @ts-ignore
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      const maxWidth = pageW - margin * 2 - 20;

      const ensurePage = (spaceNeeded = 80) => {
        if (y > pageH - margin - spaceNeeded) {
          doc.addPage();
          y = margin;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`Conteúdos — ${className}`, margin, y);
      y += 28;

      for (const c of list) {
        ensurePage(120);
        // Título da aula
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${c.seq} — ${c.title}`, margin, y);
        y += 20;

        // Corpo (com 2 quebras entre itens)
        const text = htmlToPrettyText(c.bodyHtml || "");
        if (text) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          const lines = doc.splitTextToSize(text, maxWidth);
          for (const chunk of lines) {
            ensurePage(18);
            doc.text(chunk, margin + 20, y);
            y += 14;
          }
          // 2 quebras extras depois do bloco
          y += 14;
        }

        // 4 quebras extras entre aulas
        y += 28;
      }

      const filename = `Conteudos_${sanitizeFile(className)}.pdf`;
      // download
      doc.save(filename);
      // abrir em nova aba
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      setOpen(null);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Falha ao gerar PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
        onClick={() => setOpen("calls")}
      >
        Relatório Chamadas
      </button>

      <button
        type="button"
        className="ml-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
        onClick={() => setOpen("contents")}
      >
        Conteúdos em PDF
      </button>

      {open === "calls" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Relatório de Chamadas (PDF)</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span>Início</span>
                <input
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  type="date"
                  className="rounded-xl border px-3 py-2"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Fim</span>
                <input
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  type="date"
                  className="rounded-xl border px-3 py-2"
                  required
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(null)} className="rounded-xl border px-3 py-2 text-sm">
                Cancelar
              </button>
              <button
                onClick={generateCalls}
                disabled={busy}
                className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm text-white"
              >
                {busy ? "Gerando..." : "Gerar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {open === "contents" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Conteúdos em PDF</h3>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setOpen(null)} className="rounded-xl border px-3 py-2 text-sm">
                Cancelar
              </button>
              <button
                onClick={generateContents}
                disabled={busy}
                className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm text-white"
              >
                {busy ? "Gerando..." : "Gerar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
