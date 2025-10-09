"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, UploadCloud, CheckSquare, Square } from "lucide-react";

type Student = { id: string; name: string; cpf: string | null; contact: string | null };

export default function NewCallPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Carrega alunos
  useEffect(() => {
    (async () => {
      if (!id) return;
      const res = await fetch(`/api/classes/${id}/students`, { cache: "no-store" });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.students)) {
        setStudents(data.students);
        const initial: Record<string, boolean> = {};
        for (const s of data.students) initial[s.id] = true;
        setPresence(initial);
      }
    })();
  }, [id]);

  // Presenças
  function toggleStudent(studentId: string) {
    setPresence((p) => ({ ...p, [studentId]: !p[studentId] }));
  }
  function setAll(v: boolean) {
    const all: Record<string, boolean> = {};
    for (const s of students) all[s.id] = v;
    setPresence(all);
  }

  // Importação CSV/XLSX
  async function handleImportSend() {
    if (!id || !uploadFile) {
      alert("Selecione um arquivo CSV/XLSX antes de enviar.");
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);

      const res = await fetch(`/api/classes/${id}/students/import`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao importar");

      // Recarrega alunos
      const res2 = await fetch(`/api/classes/${id}/students`, { cache: "no-store" });
      const data2 = await res2.json();
      if (data2?.ok && Array.isArray(data2.students)) {
        setStudents(data2.students);
        const next: Record<string, boolean> = {};
        for (const s of data2.students) next[s.id] = true;
        setPresence(next);
      }
      setUploadName(null);
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      alert("Erro ao importar planilha");
      console.error(e);
    } finally {
      setImporting(false);
    }
  }

  // Criar chamada + salvar presença
  async function handleCreate() {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${id}/chamadas`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao criar");

      const seq: number = data.attendance.seq;
      const presences = students.map((s) => ({ studentId: s.id, present: !!presence[s.id] }));

      const res2 = await fetch(`/api/classes/${id}/chamadas/${seq}/presences`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ presences })
      });
      const d2 = await res2.json();
      if (!res2.ok || !d2?.ok) throw new Error(d2?.error || "Falha ao salvar presenças");

      router.push(`/classes/${id}/chamadas/${seq}`);
    } catch (e) {
      alert("Erro ao criar/salvar chamada");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const totalPresentes = useMemo(
    () => students.reduce((acc, s) => acc + (presence[s.id] ? 1 : 0), 0),
    [students, presence]
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm">
        <Link href={`/classes/${id}/chamadas`} className="text-blue-700 hover:underline">
          Voltar para Chamadas
        </Link>
      </nav>

      {/* Card principal */}
      <section className="rounded-2xl border bg-white/90 shadow-soft ring-1 ring-black/5">
        {/* Header do card */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nova chamada</h1>
            <p className="text-sm text-gray-600">Marque a presença e crie a chamada desta aula.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-60"
              title="Cria a chamada e salva as presenças"
            >
              {saving ? "Salvando..." : "Criar chamada"}
            </button>
            <Link
              href={`/classes/${id}/chamadas`}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
            >
              Cancelar
            </Link>
          </div>
        </div>

        {/* Conteúdo do card */}
        <div className="px-5 py-5 space-y-5">
          {/* Campo da aula */}
          <div className="grid gap-2">
            <label className="text-sm font-medium text-gray-800">Nome da aula</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Aula 01 - Introdução"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Lista de presença */}
          <div className="rounded-2xl overflow-hidden border">
            <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
              <div className="font-semibold">Lista de presença</div>
              <div className="text-sm">
                Presentes: <b>{totalPresentes}</b> / {students.length}
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="flex flex-wrap items-center gap-2 border-b bg-blue-50 px-4 py-2 text-sm">
              <button
                className="rounded-lg border border-blue-200 px-3 py-1 hover:bg-blue-100"
                onClick={() => setAll(true)}
                title="Marca todos os alunos como presentes"
              >
                Marcar todos
              </button>
              <button
                className="rounded-lg border border-blue-200 px-3 py-1 hover:bg-blue-100"
                onClick={() => setAll(false)}
                title="Desmarca todos os alunos"
              >
                Desmarcar todos
              </button>
            </div>

            {/* Cabeçalho da grade */}
            <div className="grid grid-cols-[64px_1fr_200px_140px] border-b border-blue-200 bg-blue-100/70 text-sm font-medium text-blue-900">
              <div className="border-r border-blue-200 px-3 py-2">#</div>
              <div className="border-r border-blue-200 px-3 py-2">Aluno</div>
              <div className="hidden border-r border-blue-200 px-3 py-2 sm:block">CPF</div>
              <div className="px-3 py-2">Presente</div>
            </div>

            {/* Linhas (zebra suave) */}
            <div className="max-h-[60vh] overflow-auto">
              {students.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">Nenhum aluno cadastrado nesta turma.</div>
              ) : (
                students.map((s, idx) => {
                  const isEven = idx % 2 === 0;
                  const checked = !!presence[s.id];
                  return (
                    <div
                      key={s.id}
                      className={[
                        "grid grid-cols-[64px_1fr_200px_140px] items-center text-sm",
                        "border-b border-blue-100",
                        isEven ? "bg-blue-50/40" : "bg-white"
                      ].join(" ")}
                    >
                      <div className="border-r border-blue-100 px-3 py-2 text-gray-600 tabular-nums">{idx + 1}</div>
                      <div className="border-r border-blue-100 px-3 py-2">
                        <div className="font-medium text-gray-900">{s.name}</div>
                        {s.contact ? <div className="text-xs text-gray-500">{s.contact}</div> : null}
                      </div>
                      <div className="hidden border-r border-blue-100 px-3 py-2 sm:block">
                        <span className="tabular-nums text-gray-700">{s.cpf || "-"}</span>
                      </div>
                      <div className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleStudent(s.id)}
                          className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-blue-50"
                          title={checked ? "Marcar como ausente" : "Marcar como presente"}
                        >
                          {checked ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" aria-hidden />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" aria-hidden />
                          )}
                          <span className="text-gray-700">{checked ? "Presente" : "Ausente"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Importação (box tracejado elegante) */}
          <div className="rounded-2xl border">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-medium text-gray-900">Adicionar alunos por planilha</h3>
              <p className="text-xs text-gray-500 mt-1">
                CSV ou XLSX com colunas: <b>name</b> (obrigatório), <b>cpf</b>, <b>contact</b> (opcionais).
              </p>
            </div>

            <div className="grid gap-3 px-4 py-4">
              <div
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/40 px-6 py-8 text-center"
                onClick={() => fileRef.current?.click()}
              >
                <UploadCloud className="mb-2 h-8 w-8 text-blue-600" aria-hidden />
                <p className="text-sm font-medium text-gray-800">Clique para selecionar ou arraste seu arquivo aqui</p>
                <p className="text-xs text-gray-500">Formatos aceitos: CSV, XLSX</p>
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
                {uploadName && <div className="mt-2 text-xs text-gray-700">Selecionado: {uploadName}</div>}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportSend}
                    disabled={!uploadFile || importing}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
                  >
                    <UploadCloud className="h-4 w-4" aria-hidden /> {importing ? "Enviando..." : "Enviar planilha"}
                  </button>
                  <a className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600" href="/templates/students.csv" target="_blank" rel="noreferrer">
                    Baixar modelo CSV
                  </a>
                  <a className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600" href="/templates/students.xlsx" target="_blank" rel="noreferrer">
                    Baixar modelo XLSX
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div> {/* /px-5 py-5 */}
      </section>
    </main>
  );
}
