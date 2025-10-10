"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Student = { id: string; name: string; cpf: string | null; contact: string | null };

export default function NewCallPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [presence, setPresence] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  // Adicionar aluno
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newContact, setNewContact] = useState("");
  const [adding, setAdding] = useState(false);

  // Import planilha
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Editar aluno (modal)
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  function toggleStudent(studentId: string) {
    setPresence((p) => ({ ...p, [studentId]: !p[studentId] }));
  }
  function setAll(v: boolean) {
    const all: Record<string, boolean> = {};
    for (const s of students) all[s.id] = v;
    setPresence(all);
  }

  // Modal editar (duplo clique no nome)
  function onDblClickStudent(st: Student) {
    setEditId(st.id);
    setEditName(st.name);
  }
  async function handleEditSave() {
    if (!id || !editId) return;
    const name = editName.trim();
    if (name.length < 2) {
      alert("Informe o nome (mínimo 2 caracteres).");
      return;
    }
    try {
      const res = await fetch(`/api/classes/${id}/students/${editId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao salvar");
      setStudents((prev) => prev.map((s) => (s.id === editId ? { ...s, name } : s)));
      setEditId(null);
      setEditName("");
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar");
      console.error(e);
    }
  }
  async function handleEditDelete() {
    if (!id || !editId) return;
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return;
    try {
      const res = await fetch(`/api/classes/${id}/students/${editId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao excluir");
      setStudents(prev => prev.filter(s => s.id !== editId));
      setPresence(prev => { const c = { ...prev }; delete c[editId!]; return c; });
      setEditId(null);
      setEditName("");
    } catch (e) {
      alert("Erro ao excluir aluno");
      console.error(e);
    }
  }

  // Adicionar aluno
  async function handleAddStudent() {
    if (!id) return;
    const name = newName.trim();
    const cpf = newCpf.trim();
    const contact = newContact.trim();
    if (name.length < 2) {
      alert("Informe o nome (mínimo 2 caracteres).");
      return;
    }
    setAdding(true);
    try {
      const body: any = { name };
      if (cpf.length) body.cpf = cpf;
      if (contact.length) body.contact = contact;

      const res = await fetch(`/api/classes/${id}/students`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      let payload: any = null;
      try { payload = await res.json(); } catch {}
      if (!res.ok || !payload?.ok) {
        let msg = "Erro ao adicionar aluno";
        const e = payload?.error;
        if (typeof e === "string") msg = e;
        else if (e?.formErrors?.formErrors?.length) msg = e.formErrors.formErrors.join("\n");
        else if (e?.fieldErrors) msg = JSON.stringify(e.fieldErrors);
        throw new Error(msg);
      }

      const st: Student = payload.student;
      setStudents((prev) => [st, ...prev]);
      setPresence((p) => ({ ...p, [st.id]: true }));
      setNewName(""); setNewCpf(""); setNewContact("");
      setShowAdd(false);
    } catch (e: any) {
      alert(e?.message || "Erro ao adicionar aluno");
      console.error(e);
    } finally {
      setAdding(false);
    }
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

      const res2 = await fetch(`/api/classes/${id}/students`, { cache: "no-store" });
      const data2 = await res2.json();
      if (data2?.ok && Array.isArray(data2.students)) {
        setStudents(data2.students);
        const next: Record<string, boolean> = {};
        for (const s of data2.students) next[s.id] = true;
        setPresence(next);
      }
      setUploadName(null); setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      alert("Erro ao importar planilha");
      console.error(e);
    } finally {
      setImporting(false);
    }
  }

  // Criar chamada + presenças
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

      router.push(`/classes/${id}/chamadas`);
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

  // Importação CSV/XLSX (escopo local do componente)
  const __handleImportSend = async () => {
    if (!id || !uploadFile) {
      alert("Selecione um arquivo CSV/XLSX antes de enviar.");
      return;
    }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      const res = await fetch(`/api/classes/${id}/students/import`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao importar");

      // Recarregar alunos e refazer mapa de presenças (marca todos como presentes)
      const res2 = await fetch(`/api/classes/${id}/students`, { cache: "no-store" });
      const data2 = await res2.json().catch(() => ({}));
      if (data2?.ok && Array.isArray(data2.students)) {
        setStudents(data2.students);
        const next: Record<string, boolean> = {};
        for (const st of data2.students) next[st.id] = true;
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
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 text-sm">
        <Link href={`/classes/${id}/chamadas`} className="text-blue-700 hover:underline">Voltar para Chamadas</Link>
      </nav>

      <section className="rounded-2xl border bg-white/90 shadow-soft ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Nova chamada</h1>
            <p className="text-sm text-gray-600">Marque a presença e crie a chamada desta aula.</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Nome da aula</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Aula 01 - Introdução"
              className="mt-1 w-64 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Adicionar aluno */}
          {showAdd && (
            <div className="rounded-2xl border bg-blue-50/40 px-4 py-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-gray-700">Nome</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex.: Maria Silva"
                    className="w-full rounded-xl border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-gray-700">CPF (opcional)</label>
                  <input
                    value={newCpf}
                    onChange={(e) => setNewCpf(e.target.value)}
                    placeholder="Somente números"
                    className="w-full rounded-xl border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-medium text-gray-700">Contato (opcional)</label>
                  <input
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="Ex.: (48) 99999-9999"
                    className="w-full rounded-xl border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={adding || newName.trim().length < 2}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {adding ? "Adicionando..." : "Salvar aluno"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setNewName(""); setNewCpf(""); setNewContact(""); }}
                  className="rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de presença */}
          <div className="rounded-2xl overflow-hidden border">
            <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
              <div className="font-semibold">Lista de presença</div>
              <div className="text-sm">Presentes: <b>{totalPresentes}</b> / {students.length}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b bg-blue-50 px-4 py-2 text-sm">
              <button className="rounded-lg border border-blue-200 px-3 py-1 hover:bg-blue-100" onClick={() => setAll(true)}>Marcar todos</button>
              <button className="rounded-lg border border-blue-200 px-3 py-1 hover:bg-blue-100" onClick={() => setAll(false)}>Desmarcar todos</button>
            </div>

            <div className="grid grid-cols-[32px_1fr_36px] border-b border-blue-200 bg-blue-100/70 text-sm font-medium text-blue-900">
              <div className="px-1.5 py-2 text-center">#</div>
              <div className="px-3 py-2">Aluno</div>
              <div className="px-1.5 py-2 text-center"><span className="sr-only">Presença</span></div>
            </div>

            <div className="max-h-[60vh] overflow-auto">
              {students.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-600">Nenhum aluno cadastrado nesta turma.</div>
              ) : students.map((s, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={s.id}
                    className={[
                      "grid grid-cols-[32px_1fr_36px] items-center text-sm",
                      "border-b border-blue-100",
                      isEven ? "bg-blue-50/40" : "bg-white"
                    ].join(" ")}
                  >
                    <div className="px-1.5 py-2 text-center text-gray-600 tabular-nums">{idx + 1}</div>
                    <div className="px-3 py-2">
                      <div
                        className="font-medium text-gray-900 cursor-pointer select-none"
                        onDoubleClick={() => onDblClickStudent(s)}
                        title="Duplo clique para editar"
                      >
                        {s.name}
                      </div>
                    </div>
                    <div className="px-1.5 py-2 text-center">
                      <label className="inline-flex items-center">
                        <span className="sr-only">Presença de {s.name}</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-blue-600"
                          checked={!!presence[s.id]}
                          onChange={() => toggleStudent(s.id)}
                          aria-label={`Presença de ${s.name}`}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Barra de ações — abaixo da lista */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Criar chamada"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd((s) => !s)}
              className="rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700"
            >
              Adicionar aluno
            </button>
          </div>

          {/* Importação (CSV/XLSX) */}
          <div className="rounded-2xl border">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-medium text-gray-900">Adicionar alunos por planilha</h3>
              <p className="text-xs text-gray-600 mt-1">
                <b>Apenas o campo "name" é obrigatório</b>. "cpf" e "contact" são opcionais.
              </p>
            </div>

            <div className="grid gap-3 px-4 py-4">
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-blue-50/40 px-6 py-8 text-center">
                <p className="text-sm font-medium text-gray-800">Selecione seu arquivo CSV/XLSX</p>
                <p className="text-xs text-gray-500">Formatos aceitos: .csv, .xlsx</p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <input
                    type="file"
                    accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    id="students-file-input"
                    ref={fileRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setUploadName(f ? f.name : null);
                      setUploadFile(f);
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
                    onClick={__handleImportSend}
                    disabled={!uploadFile || importing}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {importing ? "Enviando..." : "Enviar planilha"}
                  </button>
                </div>

                {uploadName && <div className="mt-2 text-xs text-gray-700">Selecionado: {uploadName}</div>}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                  <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/students.csv" target="_blank" rel="noreferrer">
                    Baixar modelo CSV
                  </a>
                  <a className="rounded-xl border px-3 py-1.5 hover:border-blue-500 hover:text-blue-600" href="/templates/students.xlsx" target="_blank" rel="noreferrer">
                    Baixar modelo XLSX
                  </a></div>
              </div>
            </div>
          </div>
        </div>{/* /px-5 py-5 */}
      </section>

      {/* MODAL editar aluno */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Editar aluno</h2>
            <div className="mt-3 grid gap-2">
              <label className="text-xs font-medium text-gray-700">Nome</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Nome do aluno"
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleEditSave}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => { setEditId(null); setEditName(""); }}
                className="rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEditDelete}
                className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Excluir aluno
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
