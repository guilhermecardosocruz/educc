"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

type Item = { id: string; seq: number; title: string };

export default function ConteudosPage() {
  const { id } = useParams<{ id: string }>();
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  // modal form
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [desenvolvimento, setDesenvolvimento] = useState("");
  const [recursos, setRecursos] = useState("");
  const [bncc, setBncc] = useState("");
  const [saving, setSaving] = useState(false);

  // upload
  const fileRef = useRef<HTMLInputElement|null>(null);
  const [fname, setFname] = useState<string|null>(null);
  const [importing, setImporting] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/classes/${id}/conteudos`, { cache: "no-store" });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao carregar");
      setList(data.list || []);
    } catch (e:any) {
      setErr(e?.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=> { load(); }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { alert("Nome da aula é obrigatório."); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${id}/conteudos`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          objetivos, desenvolvimento, recursos, bncc
        })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao salvar");
      setOpen(false);
      setTitle(""); setObjetivos(""); setDesenvolvimento(""); setRecursos(""); setBncc("");
      await load();
    } catch (e:any) {
      alert(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function onImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/classes/${id}/conteudos/import`, { method: "POST", body: fd });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao importar");
      await load();
      if (fileRef.current) fileRef.current.value = "";
      setFname(null);
      alert(`Importação concluída: criados ${data.created ?? 0}, atualizados ${data.updated ?? 0}.`);
    } catch(e:any) {
      alert(e?.message || "Erro ao importar");
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 rounded-2xl border bg-white p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Link href={`/classes/${id}`} className="rounded-xl bg-[#0A66FF] px-4 py-2 text-white shadow hover:opacity-90">Voltar</Link>
        </div>
        <h1 className="text-2xl font-semibold">
          Conteúdos — <span className="text-[#0A66FF]">Turma</span>
        </h1>
        <p className="mt-1 text-sm text-gray-600">Gerencie os conteúdos desta turma.</p>

        <div className="mt-4">
          <button
            onClick={()=> setOpen(true)}
            className="rounded-xl bg-[#0A66FF] px-4 py-2 text-white shadow hover:opacity-90"
          >
            + Adicionar conteúdo
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border bg-white">
        {loading ? (
          <p className="p-4 text-sm text-gray-600">Carregando…</p>
        ) : err ? (
          <p className="p-4 text-sm text-red-600">{err}</p>
        ) : list.length === 0 ? (
          <div className="p-4 text-sm text-gray-700">
            Nenhum conteúdo ainda. Clique em <b>Adicionar conteúdo</b> ou importe por planilha abaixo.
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((it)=> (
              <li key={it.id} className="flex items-center justify-between p-4">
                <div className="text-sm">
                  <div className="font-medium">{it.seq} — {it.title}</div>
                </div>
                <Link
                  href={`/classes/${id}/chamadas/${it.seq}`}
                  className="rounded-full border px-3 py-1 text-sm hover:border-blue-400 hover:text-blue-700"
                >
                  Abrir
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rodapé: Import por CSV/XLSX */}
      <section className="mt-6 rounded-2xl border bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Enviar conteúdo por planilha</h2>
        <p className="mt-1 text-sm text-gray-600">
          Suporte a CSV (pronto) e XLSX (preparado). Campos: <b>nome da aula (obrigatório)</b>,
          objetivos, desenvolvimento das atividades, recursos pedagógicos e BNCC.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx"
            id="conteudos-file"
            className="hidden"
            onChange={(e)=> setFname(e.target.files?.[0]?.name ?? null)}
          />
          <label htmlFor="conteudos-file" className="cursor-pointer rounded-xl border px-3 py-2 text-sm hover:border-blue-500 hover:text-blue-600">
            Escolher arquivo (CSV/XLSX)
          </label>
          <button
            onClick={onImport}
            disabled={importing || !fname}
            className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {importing ? "Enviando..." : "Enviar planilha"}
          </button>
          {fname && <span className="text-xs text-gray-700">Selecionado: {fname}</span>}
          <a className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600" href="/templates/conteudos.csv" target="_blank" rel="noreferrer">
            Baixar modelo CSV
          </a>
          <a className="rounded-xl border px-3 py-1.5 text-sm hover:border-blue-500 hover:text-blue-600" href="/templates/conteudos.xlsx" target="_blank" rel="noreferrer">
            Baixar modelo XLSX
          </a>
        </div>
      </section>

      {/* Modal simples */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 sm:p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Novo conteúdo</h3>
            <p className="text-xs text-gray-500 mb-3">Somente <b>Nome da aula</b> é obrigatório.</p>
            <form onSubmit={onSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">Nome da aula *</label>
                <input className="input" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Ex.: Algoritmos — Aula 1" required />
              </div>
              <div>
                <label className="mb-1 block text-sm">Objetivos</label>
                <textarea className="input min-h-[72px]" value={objetivos} onChange={(e)=>setObjetivos(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Desenvolvimento das atividades</label>
                <textarea className="input min-h-[72px]" value={desenvolvimento} onChange={(e)=>setDesenvolvimento(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Recursos pedagógicos</label>
                <textarea className="input min-h-[72px]" value={recursos} onChange={(e)=>setRecursos(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm">BNCC</label>
                <input className="input" value={bncc} onChange={(e)=>setBncc(e.target.value)} placeholder="Ex.: EF06MA01" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=> setOpen(false)} className="rounded-xl border px-3 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-[#0A66FF] px-4 py-2 text-white disabled:opacity-60">
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
