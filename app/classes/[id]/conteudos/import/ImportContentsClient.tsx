"use client";
import { useRef, useState } from "react";

export default function ImportContentsClient({ id }: { id: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleSend() {
    if (!file) { alert("Selecione um arquivo CSV ou XLSX."); return; }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/classes/${id}/conteudos/import`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Falha ao importar conteúdos (HTTP ${res.status})`);
      alert(`✅ Importação concluída: ${data.created ?? 0} conteúdo(s) criado(s).`);
    } catch (e:any) {
      alert(e?.message || "Erro ao importar conteúdos.");
      console.error(e);
    } finally {
      setImporting(false);
      setFile(null);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Importar conteúdos por planilha</h2>
      <p className="mt-1 text-sm text-gray-600">
        Envie <b>CSV</b> ou <b>XLSX</b>. Cabeçalhos aceitos: <i>Nome da aula</i>/<i>Título</i>/<i>Aula</i>, <i>Objetivos</i>, <i>Desenvolvimento das Atividades</i>, <i>Recursos Pedagógicos</i>, <i>BNCC</i>.
      </p>

      <div className="mt-4 flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <button type="button" className="rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600">
            Escolher arquivo (CSV/XLSX)
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="absolute inset-0 z-10 opacity-0 cursor-pointer"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFileName(f ? f.name : null);
              setFile(f);
            }}
            aria-label="Selecionar arquivo CSV ou XLSX"
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={!file || importing}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {importing ? "Enviando..." : "Enviar planilha de conteúdos"}
        </button>

        {fileName && <div className="text-xs text-gray-700">Selecionado: {fileName}</div>}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm">
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.csv" target="_blank" rel="noreferrer">Baixar modelo CSV</a>
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.xlsx" target="_blank" rel="noreferrer">Baixar modelo XLSX</a>
        </div>
      </div>
    </section>
  );
}
