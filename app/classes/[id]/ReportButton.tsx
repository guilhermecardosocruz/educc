"use client";
import { useEffect, useRef, useState } from "react";

type RankRow = { name: string; faltas: number };

export default function ReportButton({ classId, className }:{ classId:string; className:string }) {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const jsPdfLoaded = useRef(false);

  useEffect(() => {
    const d = new Date();
    const toIso = (dt:Date) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    const end0 = toIso(d);
    const start0 = toIso(new Date(d.getFullYear(), d.getMonth()-1, d.getDate()));
    setStart(start0);
    setEnd(end0);
  }, []);

  async function ensureJsPdf(){
    if (jsPdfLoaded.current) return;
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      s.onload = () => { jsPdfLoaded.current = true; resolve(); };
      s.onerror = () => reject(new Error("Falha ao carregar jsPDF"));
      document.head.appendChild(s);
    });
  }

  async function generate(){
    if (!start || !end) { alert("Informe início e fim."); return; }
    if (start > end) { alert("Data inicial não pode ser maior que a final."); return; }
    setBusy(true);
    try {
      await ensureJsPdf();

      // alunos
      const stRes = await fetch(`/api/classes/${classId}/students`, { cache:"no-store" });
      const stData = await stRes.json().catch(()=> ({}));
      const students: Array<{ id:string; name:string }> =
        (stRes.ok && stData?.ok && Array.isArray(stData.students)) ? stData.students : [];

      // chamadas
      const chRes = await fetch(`/api/classes/${classId}/chamadas?order=asc`, { cache:"no-store" });
      const chData = await chRes.json().catch(()=> ({}));
      const chamadas: Array<{ seq:number; createdAt:string }> =
        (chRes.ok && chData?.ok && Array.isArray(chData.attendances)) ? chData.attendances : [];

      const onlyDate = (iso:string) => (iso||"").slice(0,10);
      const periodChamadas = chamadas.filter((c) => {
        const d = onlyDate(c.createdAt);
        return d && d >= start && d <= end;
      });
      const seqs:number[] = periodChamadas.map((c) => c.seq);

      // presenças
      const presenceBySeq: Record<number, Record<string, boolean>> = {};
      for (const seq of seqs) {
        const prRes = await fetch(`/api/classes/${classId}/chamadas/${seq}/presences`, { cache:"no-store" });
        const prData = await prRes.json().catch(()=> ({}));
        const rows: Array<{ studentId:string; present:boolean }> =
          (prRes.ok && prData?.ok && Array.isArray(prData.rows)) ? prData.rows : [];
        const map: Record<string, boolean> = {};
        for (const r of rows) map[r.studentId] = !!r.present;
        students.forEach((s)=> { if (!(s.id in map)) map[s.id] = false; });
        presenceBySeq[seq] = map;
      }

      // métricas
      const totalAlunos = students.length;
      let somaPresentes = 0;
      const faltas = new Map<string, number>();
      students.forEach((s)=> faltas.set(s.id, 0));

      for (const seq of seqs) {
        const pres = presenceBySeq[seq] || {};
        let presentes = 0;
        students.forEach((s)=>{
          if (pres[s.id]) presentes++;
          else faltas.set(s.id, (faltas.get(s.id) || 0) + 1);
        });
        somaPresentes += presentes;
      }

      const totalAulas = seqs.length;
      const mediaPresentesAbs = totalAulas ? Math.round((somaPresentes/totalAulas)*100)/100 : 0;
      const mediaPercentual = (totalAulas && totalAlunos) ? Math.round((mediaPresentesAbs/totalAlunos)*10000)/100 : 0;

      const ranking: RankRow[] = students
        .map<RankRow>((s)=> ({ name:s.name, faltas: faltas.get(s.id) || 0 }))
        .sort((a:RankRow, b:RankRow) => b.faltas - a.faltas);

      // PDF
      // @ts-ignore
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit:"pt", format:"a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      doc.setFont("helvetica","bold"); doc.setFontSize(14);
      doc.text(`Relatório de Chamadas — ${className}`, margin, y); y += 18;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      doc.text(`Período: ${start} a ${end}`, margin, y); y += 18;

      // cards
      const cardW = (pageW - margin*2 - 16*2) / 3;
      const cardH = 56;
      const cards = [
        { label:"Total de alunos", value:String(totalAlunos) },
        { label:"Média de presentes (abs.)", value:String(mediaPresentesAbs) },
        { label:"Média de presença (%)", value:String(mediaPercentual)+"%" },
      ];
      doc.setDrawColor(230); doc.setLineWidth(1);
      cards.forEach((c,i)=>{
        const x = margin + i*(cardW+16);
        doc.roundedRect(x, y, cardW, cardH, 8, 8);
        doc.setFontSize(9); doc.setTextColor(100);
        doc.text(c.label, x+10, y+18);
        doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(0);
        doc.text(c.value, x+10, y+42);
        doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(0);
      });
      y += cardH + 24;

      // ranking
      doc.setFont("helvetica","bold"); doc.setFontSize(12);
      doc.text("Ranking dos mais faltosos", margin, y); y += 14;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);

      const col1 = margin, col2 = margin+40, col3 = pageW - margin - 60;
      // cabeçalho
      doc.setFillColor(249,250,251);
      doc.rect(margin, y-10, pageW - margin*2, 22, "F");
      doc.setFont("helvetica","bold");
      doc.text("#", col1, y);
      doc.text("Aluno", col2, y);
      doc.text("Faltas", col3, y);
      y += 14;
      doc.setFont("helvetica","normal");

      const rowH = 16;
      for (let i=0;i<ranking.length;i++){
        const r = ranking[i];
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(String(i+1), col1, y);
        const nomeLines = doc.splitTextToSize(r.name, col3 - col2 - 10);
        doc.text(nomeLines, col2, y);
        doc.text(String(r.faltas), col3, y);
        y += rowH + (nomeLines.length-1)*10;
      }

      const footer = `Total de aulas consideradas: ${seqs.length}`;
      doc.setFontSize(9); doc.setTextColor(120);
      doc.text(footer, margin, pageH - margin/2);

      const file = `Relatorio_Chamadas_${className.replace(/\\s+/g,"_")}_${start}_a_${end}.pdf`;
      doc.save(file);
      setOpen(false);
    } catch (e:any) {
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
        title="Gerar relatório de presenças (PDF) por período"
        onClick={()=>setOpen(true)}
      >Relatório Chamadas</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Relatório de Chamadas (PDF)</h3>
            <p className="text-sm text-gray-600 mt-1">Escolha o período para consolidar presenças.</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Início</span>
                <input value={start} onChange={e=>setStart(e.target.value)} type="date" className="rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" required />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Fim</span>
                <input value={end} onChange={e=>setEnd(e.target.value)} type="date" className="rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200" required />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={()=>setOpen(false)} className="rounded-xl border px-3 py-2 text-sm hover:border-blue-400 hover:text-blue-700">Cancelar</button>
              <button type="button" onClick={generate} disabled={busy} className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90">
                {busy ? "Gerando..." : "Gerar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
