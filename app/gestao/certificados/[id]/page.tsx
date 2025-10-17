"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CertEvent = {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  local?: string;
  carga_horaria?: string;
  responsavel?: string;
  tags?: string;
  status?: string;
  observacoes?: string;
  createdAt: string;
};

const LS_KEY = "certEvents";

function loadAll(): CertEvent[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveAll(list: CertEvent[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

export default function CertEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [item, setItem] = useState<CertEvent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  // campos editáveis
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data_inicio, setDataInicio] = useState("");
  const [data_fim, setDataFim] = useState("");
  const [local, setLocal] = useState("");
  const [carga_horaria, setCargaHoraria] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const all = loadAll();
    const found = all.find((e) => e.id === String(id));
    if (!found) {
      setNotFound(true);
      return;
    }
    setItem(found);
    setNome(found.nome || "");
    setDescricao(found.descricao || "");
    setDataInicio(found.data_inicio || "");
    setDataFim(found.data_fim || "");
    setLocal(found.local || "");
    setCargaHoraria(found.carga_horaria || "");
    setResponsavel(found.responsavel || "");
    setTags(found.tags || "");
    setStatus(found.status || "");
    setObservacoes(found.observacoes || "");
  }, [id]);

  const canSave = useMemo(() => nome.trim().length > 0 && !saving, [nome, saving]);

  function onCancel() {
    router.push("/gestao/certificados");
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    try {
      const all = loadAll();
      const idx = all.findIndex((e) => e.id === item.id);
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          nome: nome.trim(),
          descricao: descricao || undefined,
          data_inicio: data_inicio || undefined,
          data_fim: data_fim || undefined,
          local: local || undefined,
          carga_horaria: carga_horaria || undefined,
          responsavel: responsavel || undefined,
          tags: tags || undefined,
          status: status || undefined,
          observacoes: observacoes || undefined,
        };
        saveAll(all);
        setItem(all[idx]);
      }
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Evento não encontrado</h1>
          <Link className="btn-primary" href="/gestao/certificados">Voltar</Link>
        </header>
        <p className="text-gray-600">Verifique se o link está correto.</p>
      </main>
    );
  }

  if (!item) {
    return <main className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">Carregando…</main>;
  }

  return (
    <main className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Evento: {item.nome}</h1>
        <Link className="btn-primary" href="/gestao/certificados">Voltar</Link>
      </header>

      <form onSubmit={onSave} className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Nome do evento *</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Data início</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={data_inicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Data fim</label>
          <input
            type="date"
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={data_fim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Local</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Carga horária</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={carga_horaria}
            onChange={(e) => setCargaHoraria(e.target.value)}
            placeholder="Ex.: 8h"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Responsável</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={responsavel}
            onChange={(e) => setResponsavel(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tags</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="formação, oficina"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="rascunho, ativo"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={3}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-end gap-3">
          <button
            type="button"
            className="h-10 px-4 rounded-md border hover:bg-gray-50"
            onClick={onCancel}
          >
            Voltar
          </button>
          <button
            type="submit"
            className="btn-primary disabled:opacity-60"
            disabled={!canSave}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </main>
  );
}
