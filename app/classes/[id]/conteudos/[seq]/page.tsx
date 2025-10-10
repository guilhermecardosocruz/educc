"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Content = {
  id: string; seq: number; title: string; bodyHtml?: string;
  objetivos?: string; desenvolvimento?: string; recursos?: string; bncc?: string;
};

export default function ConteudoDetailPage() {
  const { id, seq } = useParams<{ id: string; seq: string }>();
  const router = useRouter();
  const [data, setData] = useState<Content | null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // flags de edição por campo: começa só leitura; habilita com duplo clique
  const [edit, setEdit] = useState<{title:boolean; objetivos:boolean; desenvolvimento:boolean; recursos:boolean; bncc:boolean}>({
    title: false, objetivos: false, desenvolvimento: false, recursos: false, bncc: false
  });

  // valores editáveis
  const [title, setTitle] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [desenvolvimento, setDesenvolvimento] = useState("");
  const [recursos, setRecursos] = useState("");
  const [bncc, setBncc] = useState("");

  function loadLocal(j: Content) {
    setData(j);
    setTitle(j.title || "");
    setObjetivos(j.objetivos || "");
    setDesenvolvimento(j.desenvolvimento || "");
    setRecursos(j.recursos || "");
    setBncc(j.bncc || "");
  }

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/classes/${id}/conteudos/${seq}`, { cache: "no-store" });
        const j = await res.json().catch(()=> ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || "Não encontrado");
        loadLocal(j.content);
      } catch(e:any) {
        setErr(e?.message || "Erro ao carregar conteúdo");
      }
    }
    if (id && seq) run();
  }, [id, seq]);

  async function onSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${id}/conteudos/${seq}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, objetivos, desenvolvimento, recursos, bncc })
      });
      const j = await res.json().catch(()=> ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Falha ao salvar");
      loadLocal(j.content);
      // volta todos para read-only após salvar
      setEdit({ title:false, objetivos:false, desenvolvimento:false, recursos:false, bncc:false });
      alert("Conteúdo atualizado.");
    } catch(e:any) {
      alert(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/classes/${id}/conteudos/${seq}`, { method: "DELETE" });
      const j = await res.json().catch(()=> ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Falha ao excluir");
      // volta para a lista
      router.push(`/classes/${id}/conteudos`);
    } catch(e:any) {
      alert(e?.message || "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/classes/${id}/conteudos`} className="rounded-xl border px-3 py-2 text-sm hover:border-blue-400 hover:text-blue-700">
          Voltar
        </Link>
        {data && <div className="text-sm text-gray-500">Aula {data.seq}</div>}
      </div>

      {err ? (
        <p className="text-sm text-red-600">{err}</p>
      ) : !data ? (
        <p className="text-sm text-gray-600">Carregando…</p>
      ) : (
        <section className="rounded-2xl border bg-white p-6 space-y-4">
          {/* Título (nome da aula) */}
          <div onDoubleClick={()=> setEdit(s => ({...s, title:true}))}>
            <label className="mb-1 block text-sm text-gray-600">Nome da aula</label>
            <input
              className="input disabled:opacity-70"
              value={title}
              onChange={(e)=> setTitle(e.target.value)}
              disabled={!edit.title}
              placeholder="Ex.: Algoritmos — Aula 1"
            />
            {!edit.title && <p className="mt-1 text-xs text-gray-500">Dê dois cliques para editar</p>}
          </div>

          {/* Objetivos */}
          <div onDoubleClick={()=> setEdit(s => ({...s, objetivos:true}))}>
            <label className="mb-1 block text-sm text-gray-600">Objetivos</label>
            <textarea
              className="input min-h-[80px] disabled:opacity-70"
              value={objetivos}
              onChange={(e)=> setObjetivos(e.target.value)}
              disabled={!edit.objetivos}
            />
            {!edit.objetivos && <p className="mt-1 text-xs text-gray-500">Dê dois cliques para editar</p>}
          </div>

          {/* Desenvolvimento das atividades */}
          <div onDoubleClick={()=> setEdit(s => ({...s, desenvolvimento:true}))}>
            <label className="mb-1 block text-sm text-gray-600">Desenvolvimento das atividades</label>
            <textarea
              className="input min-h-[100px] disabled:opacity-70"
              value={desenvolvimento}
              onChange={(e)=> setDesenvolvimento(e.target.value)}
              disabled={!edit.desenvolvimento}
            />
            {!edit.desenvolvimento && <p className="mt-1 text-xs text-gray-500">Dê dois cliques para editar</p>}
          </div>

          {/* Recursos pedagógicos */}
          <div onDoubleClick={()=> setEdit(s => ({...s, recursos:true}))}>
            <label className="mb-1 block text-sm text-gray-600">Recursos pedagógicos</label>
            <textarea
              className="input min-h-[80px] disabled:opacity-70"
              value={recursos}
              onChange={(e)=> setRecursos(e.target.value)}
              disabled={!edit.recursos}
            />
            {!edit.recursos && <p className="mt-1 text-xs text-gray-500">Dê dois cliques para editar</p>}
          </div>

          {/* BNCC */}
          <div onDoubleClick={()=> setEdit(s => ({...s, bncc:true}))}>
            <label className="mb-1 block text-sm text-gray-600">BNCC</label>
            <input
              className="input disabled:opacity-70"
              value={bncc}
              onChange={(e)=> setBncc(e.target.value)}
              disabled={!edit.bncc}
              placeholder="Ex.: EF06MA01"
            />
            {!edit.bncc && <p className="mt-1 text-xs text-gray-500">Dê dois cliques para editar</p>}
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onDelete}
              disabled={deleting}
              className="rounded-xl border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {deleting ? "Excluindo..." : "Excluir conteúdo"}
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
