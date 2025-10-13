"use client";
import { useEffect, useRef, useState } from "react";

type RankRow = { name: string; faltas: number };

function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, " ").trim();
}

export default function ReportButton({ classId, className }:{ classId:string; className:string }) {
  const [open, setOpen] = useState<null|"calls"|"contents">(null);
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

  async function generateContents(){
    setBusy(true);
    try {
      await ensureJsPdf();
      const res = await fetch(`/api/classes/${classId}/conteudos/full`, { cache:"no-store" });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao carregar conteúdos");
      const contents: Array<{seq:number; title:string; bodyHtml?:string}> = data.list;

      // @ts-ignore
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF({ unit:"pt", format:"a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = margin;

      doc.setFont("helvetica","bold"); doc.setFontSize(14);
      doc.text(`Conteúdos — ${className}`, margin, y); y += 24;

      contents.forEach((c)=>{
        if (y > 700) { doc.addPage(); y = margin; }
        doc.setFont("helvetica","bold"); doc.setFontSize(12);
        doc.text(`${c.seq} — ${c.title}`, margin, y); y += 16;
        const body = stripHtml(c.bodyHtml || "");
        if (body) {
          const bodyLines = doc.splitTextToSize(body, pageW - margin*2 - 20);
          doc.setFont("helvetica","normal"); doc.setFontSize(10);
          doc.text(bodyLines, margin+20, y);
          y += bodyLines.length * 14 + 8;
        }
      });

      const file = `Conteudos_${className.replace(/\s+/g,"_")}.pdf`;
      doc.save(file);
      setOpen(null);
    } catch (e:any) {
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
        onClick={()=>setOpen("contents")}
      >
        Conteúdos em PDF
      </button>

      {open==="contents" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Conteúdos em PDF</h3>
            <p className="text-sm text-gray-600 mt-1">Gerar listagem dos conteúdos cadastrados.</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button type="button" onClick={()=>setOpen(null)} className="rounded-xl border px-3 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={generateContents} disabled={busy} className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white">
                {busy ? "Gerando..." : "Gerar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
