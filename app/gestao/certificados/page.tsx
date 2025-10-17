"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CertEvent = {
  id: string;
  nome: string; // obrigatório
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

function loadEvents(): CertEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEvents(list: CertEvent[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {}
}

export default function GestaoCertificadosPage() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<CertEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // campos do formulário (apenas "nome" é obrigatório)
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
    setEvents(loadEvents().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }, []);

  const canCreate = useMemo(() => nome.trim().length > 0 && !saving, [nome, saving]);

  function resetForm() {
    setNome("");
    setDescricao("");
    setDataInicio("");
    setDataFim("");
    setLocal("");
    setCargaHoraria("");
    setResponsavel("");
    setTags("");
    setStatus("");
    setObservacoes("");
    setError(null);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nome.trim()) {
      setError("Informe o nome do evento");
      return;
    }
    setSaving(true);
    try {
      const id = `${Date.now()}`;
      const item: CertEvent = {
        id,
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
        createdAt: new Date().toISOString(),
      };
      const next = [item, ...events];
      setEvents(next);
      saveEvents(next);
      setOpen(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Requisitos para Certificados</h1>
        <Link href="/gestao" className="btn-primary">Voltar</Link>
      </header>

      <section className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            Adicionar novo evento
          </button>
        </div>

        {/* Lista */}
        {events.length === 0 ? (
          <p className="text-gray-600">Nenhum evento criado ainda.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/gestao/certificados/${ev.id}`}
                  className="block border rounded-lg px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="font-medium">{ev.nome}</div>
                  <div className="text-xs text-gray-500">
                    {ev.data_inicio || ev.data_fim
                      ? `${ev.data_inicio || "?"} — ${ev.data_fim || "?"}`
                      : "Sem período definido"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-xl bg-white shadow-lg">
              <form onSubmit={onCreate}>
                <div className="px-5 py-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Novo evento</h2>
                  <button
                    type="button"
                    className="h-8 px-3 rounded-md border hover:bg-gray-50"
                    onClick={() => setOpen(false)}
                  >
                    Fechar
                  </button>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Nome do evento *</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex.: Semana Pedagógica 2025"
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
                      placeholder="Breve descrição do evento"
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
                      placeholder="Auditório, sala, endereço…"
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
                      placeholder="Nome/contato"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tags</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="Ex.: formação, oficina"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <input
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      placeholder="Ex.: rascunho, ativo"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Observações</label>
                    <textarea
                      className="mt-1 w-full rounded-md border px-3 py-2"
                      rows={3}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações gerais"
                    />
                  </div>

                  {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
                </div>

                <div className="px-5 py-4 border-t flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="h-10 px-4 rounded-md border hover:bg-gray-50"
                    onClick={() => { setOpen(false); }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!canCreate}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? "Criando..." : "Criar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
