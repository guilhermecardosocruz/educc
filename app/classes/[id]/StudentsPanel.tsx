"use client";
import { useEffect, useRef, useState } from "react";

type Student = { id: string; name: string; cpf: string; contact: string };

export default function StudentsPanel({ classId }: { classId: string }) {
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({ name: "", cpf: "", contact: "" });
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<Student[] | null>(null);
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [importing, setImporting] = useState(false);

  async function load() {
    const res = await fetch(`/api/classes/${classId}/students`, { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) setList(data.students as Student[]);
    else setList([]);
  }
  useEffect(() => { load(); }, [classId]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "Erro ao adicionar");
      } else {
        setList(prev => prev ? [data.student as Student, ...prev] : [data.student as Student]);
        setOpenAdd(false);
        setForm({ name: "", cpf: "", contact: "" });
      }
    } catch {
      alert("Falha de rede");
    } finally {
      setSaving(false);
    }
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/classes/${classId}/students/import`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "Erro ao importar");
      } else {
        setList(prev => prev ? [...data.students, ...prev] : data.students);
        alert(`Importados: ${data.createdCount}`);
      }
    } catch {
      alert("Falha de rede");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <section className="card p-6 mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alunos</h2>
        <div className="flex gap-2">
          <button onClick={() => setOpenAdd(true)} className="btn-primary">Adicionar aluno</button>
          <label className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
            {importing ? "Importando..." : "Importar CSV/XLSX"}
            <input ref={fileRef} onChange={onImport} type="file" accept=".csv,.xlsx" className="hidden" />
          </label>
          <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.csv" target="_blank">Modelo CSV</a>
          <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.xlsx" target="_blank">Modelo XLSX</a>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-4">
        {list === null ? (
          <div className="text-gray-600">Carregando...</div>
        ) : list.length === 0 ? (
          <div className="text-gray-600">Nenhum aluno cadastrado.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map(s => (
              <li key={s.id} className="rounded-xl border p-4 bg-gradient-to-br from-[var(--color-brand-blue)]/10 to-[var(--color-brand-blue)]/5">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-gray-600 mt-1">CPF: {s.cpf || "-"}</div>
                <div className="text-xs text-gray-600">Contato: {s.contact || "-"}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Drawer de adicionar */}
      {openAdd && (
        <div className="mt-6 rounded-2xl border p-4">
          <h3 className="font-semibold mb-3">Adicionar aluno</h3>
          <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
    </section>
  );
}
