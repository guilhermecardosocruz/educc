"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Student = { id: string; name: string; cpf?: string; contact?: string };

export default function NewChamadaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const classId = params?.id;

  // ui state
  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<Student[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // add aluno inline
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ name: "", cpf: "", contact: "" });
  const [saving, setSaving] = useState(false);

  // import
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // carrega alunos da turma
  async function loadStudents() {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.ok) setStudents(data.students);
      else setStudents([]);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudents(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [classId]);

  // criar chamada
  async function createChamada() {
    if (!classId) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/classes/${classId}/chamadas`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "Erro ao criar chamada");
        return;
      }
      router.push(`/classes/${classId}/chamadas/${data.attendance.seq}`);
    } catch {
      alert("Falha de rede");
    } finally {
      setCreating(false);
    }
  }

  // adicionar aluno
  async function onAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "Erro ao adicionar aluno");
      } else {
        setStudents(prev => prev ? [data.student, ...prev] : [data.student]);
        setOpenAdd(false);
        setForm({ name: "", cpf: "", contact: "" });
      }
    } catch {
      alert("Falha de rede");
    } finally {
      setSaving(false);
    }
  }

  // importar planilha
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !classId) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/classes/${classId}/students/import`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setImportMsg(data?.error ?? "Erro ao importar");
      } else {
        setStudents(prev => prev ? [...data.students, ...prev] : data.students);
        setImportMsg(`Importados: ${data.createdCount}`);
      }
    } catch {
      setImportMsg("Falha de rede");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // UI
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full bg-[var(--color-brand-blue)]" />
              <span className="font-semibold">EDUCC</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/classes/${classId}/chamadas`)}
                className="rounded-xl px-3 py-2 text-sm border"
              >
                Cancelar
              </button>
            </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-2xl font-bold">Nova chamada</h1>
          <p className="text-white/80 text-sm mt-1">Defina o título, revise os alunos e crie a chamada.</p>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="card p-6">
          {/* título */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nome da aula</label>
            <input
              className="input w-full"
              placeholder="Ex.: Aula 01 - Introdução"
              value={title}
              onChange={e=>setTitle(e.target.value)}
            />
          </div>

          {/* ações */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => alert("O conteúdo abre após a chamada ser criada (usamos o mesmo ID).")}
              title="Abrirá o conteúdo desta chamada em nova aba após a criação"
            >
              Conteúdo
            </button>

            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => setOpenAdd(true)}
            >
              Adicionar aluno
            </button>
          </div>

          {/* lista alunos */}
          <div className="mt-4 grid gap-2">
            {loading ? (
              <div className="rounded-xl border px-4 py-3 text-sm text-gray-600">Carregando alunos...</div>
            ) : !students || students.length === 0 ? (
              <div className="rounded-xl border px-4 py-3 text-sm text-gray-600">Nenhum aluno na turma ainda.</div>
            ) : students.map((s) => (
              <label key={s.id} className="flex items-center justify-between rounded-xl border px-4 py-3 bg-gradient-to-br from-[var(--color-brand-blue)]/8 to-[var(--color-brand-blue)]/4">
                <span className="capitalize">{s.name}</span>
                <span className="inline-flex items-center gap-2 text-sm">
                  Presente
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--color-brand-blue)]" />
                </span>
              </label>
            ))}
          </div>

          {/* importar */}
          <div className="mt-6 border rounded-2xl p-4">
            <h2 className="font-medium">Adicionar alunos por planilha</h2>
            <p className="text-sm text-gray-600 mt-1">
              CSV ou XLSX com colunas: <b>name</b> (obrigatório), <b>cpf</b> e <b>contact</b> (opcionais).
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border-2 border-dashed p-8 text-center text-sm text-gray-600">
                <div className="text-3xl">+</div>
                <p className="mt-1">Clique para selecionar ou arraste seu arquivo aqui</p>
                <p className="text-xs mt-1">Formatos aceitos: CSV, XLSX</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="mt-3"
                  onChange={onImport}
                />
                {importing && <p className="mt-2 text-sm">Importando...</p>}
                {importMsg && <p className="mt-2 text-sm text-gray-700">{importMsg}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.csv" target="_blank">Baixar modelo CSV</a>
                <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.xlsx" target="_blank">Baixar modelo XLSX</a>
              </div>
            </div>
          </div>

          {/* footer actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              className="btn-primary"
              onClick={createChamada}
              disabled={creating}
            >
              {creating ? "Criando..." : "Criar chamada"}
            </button>
            <button
              onClick={() => router.push(`/classes/${classId}/chamadas`)}
              className="rounded-xl px-3 py-2 text-sm border"
            >
              Cancelar
            </button>
          </div>

          {/* drawer add aluno */}
          {openAdd && (
            <div className="mt-6 rounded-2xl border p-4">
              <h3 className="font-semibold mb-3">Adicionar aluno</h3>
              <form onSubmit={onAddStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm mb-1">Nome</label>
                  <input className="input w-full" required
                         value={form.name}
                         onChange={e=>setForm(f=>({...f, name:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-sm mb-1">CPF</label>
                  <input className="input w-full"
                         value={form.cpf}
                         onChange={e=>setForm(f=>({...f, cpf:e.target.value}))}
                         placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Contato</label>
                  <input className="input w-full"
                         value={form.contact}
                         onChange={e=>setForm(f=>({...f, contact:e.target.value}))}
                         placeholder="(11) 90000-0000" />
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                  <button type="button" onClick={()=>setOpenAdd(false)} className="rounded-xl px-3 py-2 text-sm border">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
