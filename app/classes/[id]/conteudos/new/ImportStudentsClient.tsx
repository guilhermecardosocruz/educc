"use client";
import { useRef, useState } from "react";

export default function ImportStudentsClient({ id }: { id: string }) {
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
      const res = await fetch(`/api/classes/${id}/students/import`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        const msg = data?.error || `Falha ao importar alunos (HTTP ${res.status})`;
        throw new Error(msg);
      }
      alert(`✅ Importação concluída: ${data.inserted ?? 0} aluno(s) inserido(s).`);
    } catch (e: any) {
      alert(e?.message || "Erro ao importar alunos.");
      console.error(e);
    } finally {
      setImporting(false);
      setFile(null);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Importar alunos por planilha</h2>
      <p className="mt-1 text-sm text-gray-600">
        Envie um arquivo <b>CSV</b> ou <b>XLSX</b> com pelo menos a coluna <code>name</code> (aceita <code>nome</code>).
        Campos opcionais: <code>cpf</code>, <code>contact</code>/<code>contato</code>/<code>telefone</code>/<code>whatsapp</code>.
      </p>

      <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/40 px-6 py-8 text-center">
        <p className="text-sm font-medium text-gray-800">Selecione seu arquivo CSV/XLSX</p>
        <p className="text-xs text-gray-500">Formatos aceitos: .csv, .xlsx</p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            id="students-file-input"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFileName(f ? f.name : null);
              setFile(f);
            }}
          />
          <label
            htmlFor="students-file-input"
            className="cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600"
          >
            Escolher arquivo
          </label>

          <button
            type="button"
            onClick={handleSend}
            disabled={!file || importing}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {importing ? "Enviando..." : "Enviar planilha de alunos"}
          </button>
        </div>

        {fileName && <div className="mt-2 text-xs text-gray-700">Selecionado: {fileName}</div>}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/students.csv" target="_blank" rel="noreferrer">
            Baixar modelo CSV (alunos)
          </a>
          <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/students.xlsx" target="_blank" rel="noreferrer">
            Baixar modelo XLSX (alunos)
          </a>
        </div>
      </div>
    </section>
  );
}
