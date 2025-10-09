"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useRef, useState } from "react";

export default function NewCallPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<string[]>([]);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function addStudentManual() {
    const v = prompt("Nome do aluno:");
    if (v && v.trim()) setStudents((s) => [...s, v.trim()]);
  }

  async function handleCreate() {
    if (!id) return;
    setSaving(true);
    try {
      // nossa API cria a chamada e devolve { ok, attendance: { seq } }
      const res = await fetch(`/api/classes/${id}/chamadas`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined, students }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao criar");
      // redireciona usando o seq (ID lógico incremental)
      router.push(`/classes/${id}/chamadas/${data.attendance.seq}`);
    } catch (e) {
      alert("Erro ao criar chamada");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleImportSend() {
    if (!id || !uploadFile) {
      alert("Selecione um arquivo CSV/XLSX antes de enviar.");
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      const res = await fetch(`/api/classes/${id}/students/import`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao importar");

      // opcional: incorporar nomes importados na listagem local (só nomes)
      const importedNames: string[] = (data.students ?? [])
        .map((s: any) => s?.name)
        .filter(Boolean);

      if (importedNames.length) {
        setStudents((prev) => [...importedNames, ...prev]);
      }
      alert(`Importados: ${data.createdCount}`);
    } catch (e) {
      alert("Erro ao importar planilha");
      console.error(e);
    } finally {
      setImporting(false);
      setUploadName(null);
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nova chamada</h1>
        <Link
          href={`/classes/${id}/chamadas`}
          className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600"
        >
          Cancelar
        </Link>
      </header>

      <div className="space-y-4 rounded-2xl border p-4">
        {/* Título */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Nome da aula</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Aula 01 - Introdução"
            className="w-full rounded-xl border px-3 py-2"
          />
        </div>

        {/* Ações principais */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600"
            onClick={() => alert("O conteúdo abre depois que a chamada for criada.")}
            title="Conteúdo usa o mesmo ID da chamada"
          >
            Conteúdo
          </button>
          <button
            type="button"
            onClick={addStudentManual}
            className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600"
          >
            Adicionar aluno
          </button>
        </div>

        {/* Lista de alunos adicionados (manuais + importados) */}
        <div className="rounded-xl border p-3">
          {students.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum aluno adicionado.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm">
              {students.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Importar planilha (botão) */}
        <div className="space-y-3 rounded-2xl border p-4">
          <h2 className="font-medium">Adicionar alunos por planilha</h2>
          <p className="text-sm text-gray-600">
            CSV ou XLSX com colunas: <b>name</b> (obrigatório), <b>cpf</b> e <b>contact</b> (opcionais).
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600"
              onClick={() => fileRef.current?.click()}
            >
              Selecionar arquivo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setUploadName(f ? f.name : null);
                setUploadFile(f);
              }}
            />
            {uploadName && <span className="text-sm text-gray-700">Selecionado: {uploadName}</span>}
            <button
              type="button"
              onClick={handleImportSend}
              disabled={!uploadFile || importing}
              className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
            >
              {importing ? "Enviando..." : "Enviar planilha"}
            </button>
          </div>

          <div className="flex gap-2">
            <a className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600" href="/templates/students.csv" target="_blank" rel="noreferrer">
              Baixar modelo CSV
            </a>
            <a className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600" href="/templates/students.xlsx" target="_blank" rel="noreferrer">
              Baixar modelo XLSX
            </a>
          </div>
          <p className="text-xs text-gray-500">Colunas: name (obrigatório), cpf (opcional), contact (opcional)</p>
        </div>

        {/* Footer */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Criando..." : "Criar chamada"}
          </button>
          <Link
            href={`/classes/${id}/chamadas`}
            className="rounded-xl border px-3 py-2 text-sm hover:border-blue-500 hover:text-blue-600"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </main>
  );
}
