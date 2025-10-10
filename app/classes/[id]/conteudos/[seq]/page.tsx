"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Content = {
  id: string; seq: number; title: string; bodyHtml?: string;
  objetivos?: string; desenvolvimento?: string; recursos?: string; bncc?: string;
};

// Componente de campo editável com overlay que captura double-click
function EditableField({
  label, value, setValue, multiline = false, editing, setEditing, placeholder
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  multiline?: boolean;
  editing: boolean;
  setEditing: (v: boolean) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <label className="mb-1 block text-sm text-gray-600">{label}</label>
      {multiline ? (
        <textarea
          className={`input min-h-[96px] ${editing ? "" : "opacity-70"}`}
          value={value}
          onChange={(e)=> setValue(e.target.value)}
          disabled={!editing}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={`input ${editing ? "" : "opacity-70"}`}
          value={value}
          onChange={(e)=> setValue(e.target.value)}
          disabled={!editing}
          placeholder={placeholder}
        />
      )}
      {/* Overlay: quando não está editando, captura o double-click */}
      {!editing && (
        <button
          type="button"
          aria-label={`Editar ${label}`}
          title="Dê dois cliques para editar"
          onDoubleClick={()=> setEditing(true)}
          className="absolute inset-0 cursor-text"
          // botão invisível
          style={{ background: "transparent" }}
        />
      )}
      {!editing && <p className="mt-1 text-xs text-gray-500">Dê dois cliques para editar</p>}
    </div>
  );
}

export default function ConteudoDetailPage() {
  const { id, seq } = useParams<{ id: string; seq: string }>();
  const router = useRouter();
  const [data, setData] = useState<Content | null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // flags de edição (double-click liga)
  const [edit, setEdit] = useState<{title:boolean; objetivos:boolean; desenvolvimento:boolean; recursos:boolean; bncc:boolean}>({
    title: false, objetivos: false, desenvolvimento: false, recursos: false, bncc: false
  });

  // valores
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
        <section className="space-y-4 rounded-2xl border bg-white p-6">
          <EditableField
            label="Nome da aula"
            value={title}
            setValue={setTitle}
            editing={edit.title}
            setEditing={(v)=> setEdit(s=> ({...s, title:v}))}
            placeholder="Ex.: Algoritmos — Aula 1"
          />
          <EditableField
            label="Objetivos"
            value={objetivos}
            setValue={setObjetivos}
            editing={edit.objetivos}
            setEditing={(v)=> setEdit(s=> ({...s, objetivos:v}))}
            multiline
          />
          <EditableField
            label="Desenvolvimento das atividades"
            value={desenvolvimento}
            setValue={setDesenvolvimento}
            editing={edit.desenvolvimento}
            setEditing={(v)=> setEdit(s=> ({...s, desenvolvimento:v}))}
            multiline
          />
          <EditableField
            label="Recursos pedagógicos"
            value={recursos}
            setValue={setRecursos}
            editing={edit.recursos}
            setEditing={(v)=> setEdit(s=> ({...s, recursos:v}))}
            multiline
          />
          <EditableField
            label="BNCC"
            value={bncc}
            setValue={setBncc}
            editing={edit.bncc}
            setEditing={(v)=> setEdit(s=> ({...s, bncc:v}))}
            placeholder="Ex.: EF06MA01"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onDelete}
              disabled={deleting}
              className="rounded-xl border px-4 py-2 text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Excluir
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-white disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
