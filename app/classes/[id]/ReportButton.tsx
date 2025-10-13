"use client";
import { useEffect, useRef, useState } from "react";

type RankRow = { name: string; faltas: number };

export default function ReportButton({ classId, className }:{ classId:string; className:string }) {
  const [open, setOpen] = useState<null | "calls" | "contents">(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const jsPdfLoaded = useRef(false);

  useEffect(() => {
    const d = new Date();
    const toIso = (dt:Date) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    setEnd(toIso(d));
    setStart(toIso(new Date(d.getFullYear(), d.getMonth()-1, d.getDate())));
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

  // Relatório de Chamadas
  async function generateCalls(){
    if (!start || !end) { alert("Informe início e fim."); return; }
    if (start > end) { alert("Data inicial não pode ser maior que a final."); return; }
    setBusy(true);
    try {
      await ensureJsPdf();

      // @ts-ignore
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit:"pt", format:"a4" });
      let y = 40;
      doc.setFont("helvetica","bold"); doc.setFontSize(14);
      doc.text(`Relatório de Chamadas — ${className}`, 40, y); y += 28;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      doc.text(`Período: ${start} a ${end}`, 40, y); y += 28;
      doc.text("Exemplo de dados de chamadas...", 40, y); y += 20;

      const filename = `Relatorio_Chamadas_${className}.pdf`;
      doc.save(filename); // faz download
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank"); // abre numa nova aba

      setOpen(null);
    } catch (e:any) {
      console.error(e);
      alert(e?.message || "Falha ao gerar PDF.");
    } finally { setBusy(false); }
  }

  // Relatório de Conteúdos
  async function generateContents(){
    setBusy(true);
    try {
      await ensureJsPdf();

      // @ts-ignore
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit:"pt", format:"a4" });
      let y = 40;
      doc.setFont("helvetica","bold"); doc.setFontSize(14);
      doc.text(`Conteúdos — ${className}`, 40, y); y += 28;
      doc.setFont("helvetica","normal"); doc.setFontSize(10);
      doc.text("Exemplo de dados de conteúdos...", 40, y); y += 20;

      const filename = `Conteudos_${className}.pdf`;
      doc.save(filename); // faz download
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank"); // abre numa nova aba

      setOpen(null);
    } catch(e:any) {
      console.error(e);
      alert(e?.message || "Falha ao gerar PDF.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <button
        type="button"
        className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
        onClick={()=>setOpen("calls")}
      >Relatório Chamadas</button>

      <button
        type="button"
        className="ml-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
        onClick={()=>setOpen("contents")}
      >Conteúdos em PDF</button>

      {open==="calls" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Relatório de Chamadas (PDF)</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span>Início</span>
                <input value={start} onChange={e=>setStart(e.target.value)} type="date" className="rounded-xl border px-3 py-2" required />
              </label>
              <label className="grid gap-1 text-sm">
                <span>Fim</span>
                <input value={end} onChange={e=>setEnd(e.target.value)} type="date" className="rounded-xl border px-3 py-2" required />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={()=>setOpen(null)} className="rounded-xl border px-3 py-2 text-sm">Cancelar</button>
              <button onClick={generateCalls} disabled={busy} className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm text-white">
                {busy ? "Gerando..." : "Gerar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {open==="contents" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Relatório de Conteúdos (PDF)</h3>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={()=>setOpen(null)} className="rounded-xl border px-3 py-2 text-sm">Cancelar</button>
              <button onClick={generateContents} disabled={busy} className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm text-white">
                {busy ? "Gerando..." : "Gerar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
