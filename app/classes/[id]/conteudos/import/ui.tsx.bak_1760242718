"use client";
import Link from "next/link";
import { useRef, useState } from "react";

export default function ImportClient({ id }: { id: string }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleSend() {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Rota esperada no backend:
      // POST /api/classes/[id]/conteudos/import -> cria conteúdos e retorna { ok, count }
      const res = await fetch(`/api/classes/${id}/conteudos/import`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao importar");
      alert(`Importação concluída: ${data.count || 0} conteúdos criados.`);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Erro ao importar");
    } finally {
      setImporting(false);
      setFile(null);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/classes/${id}/conteudos`} className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600">
          Voltar
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Importar conteúdos por planilha</h1>
        <p className="text-sm text-gray-600 mb-4">
          Aceita <b>.csv</b> ou <b>.xlsx</b> com colunas: <code>title</code> (obrigatório) e <code>description</code> (opcional).
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            id="contents-file-input"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFileName(f ? f.name : null);
              setFile(f);
            }}
          />
          <label
            htmlFor="contents-file-input"
            className="cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600"
          >
            Escolher arquivo
          </label>
          <button
            type="button"
            onClick={handleSend}
            disabled={!file || importing}
            className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {importing ? "Enviando..." : "Importar planilha"}
          </button>
          {fileName && <span className="text-sm text-gray-700">Selecionado: {fileName}</span>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.csv" target="_blank" rel="noreferrer">
            Baixar modelo CSV
          </a>
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.xlsx" target="_blank" rel="noreferrer">
            Baixar modelo XLSX
          </a>
        </div>
      </div>
    </main>
  );
}
