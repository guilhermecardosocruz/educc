"use client";

import { useRef, useState } from "react";

export function ImportContentsBox({ classId }: { classId: string }) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImportSend() {
    if (!uploadFile) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      const res = await fetch(`/api/classes/${classId}/conteudos/import`, {
        method: "POST",
        body: fd,
      });

      let errorMsg = "Erro ao importar conteúdos";
      let data: any = null;
      try { data = await res.json(); } catch {}
      if (!res.ok || !data?.ok) {
        if (data?.error) {
          if (typeof data.error === "string") errorMsg = data.error;
          else if (data.error?.formErrors?.formErrors?.length) errorMsg = data.error.formErrors.formErrors.join("\n");
          else if (data.error?.fieldErrors) errorMsg = JSON.stringify(data.error.fieldErrors);
        }
        throw new Error(errorMsg);
      }

      // sucesso: recarrega a lista
      setUploadFile(null);
      setUploadName(null);
      if (fileRef.current) fileRef.current.value = "";
      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Erro ao importar conteúdos");
      console.error(e);
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border bg-white">
      <div className="border-b px-5 py-5">
        <h3 className="text-sm font-semibold text-gray-900">Importar conteúdos por planilha</h3>
        <p className="mt-1 text-xs text-gray-600">
          Formatos aceitos: <b>.csv</b>, <b>.xlsx</b>. Mantenha o cabeçalho: <b>Aula, Título, Conteúdo da Aula, Objetivos, Desenvolvimento das Atividades, Recursos Didáticos, BNCC</b>.
        </p>
      </div>

      <div className="px-5 py-5">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/40 px-6 py-8 text-center">
          <p className="text-sm font-medium text-gray-800">Selecione seu arquivo CSV/XLSX</p>
          <p className="text-xs text-gray-500">Formatos aceitos: .csv, .xlsx</p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              id="contents-file-input"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setUploadName(f ? f.name : null);
                setUploadFile(f);
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
              onClick={handleImportSend}
              disabled={!uploadFile || importing}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {importing ? "Enviando..." : "Enviar planilha"}
            </button>
          </div>

          {uploadName && (
            <div className="mt-2 text-xs text-gray-700">Selecionado: {uploadName}</div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.csv" target="_blank" rel="noreferrer">
              Baixar modelo CSV
            </a>
            <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/contents.xlsx" target="_blank" rel="noreferrer">
              Baixar modelo XLSX
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
