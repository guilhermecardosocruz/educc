"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CreateCertEventModal from "@/components/CreateCertEventModal";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<CertEvent[]>([]);

  useEffect(() => {
    setEvents(loadEvents().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }, []);

  function handleCreate({ id, nome }: { id: string; nome: string }) {
    // cria somente com nome; demais campos ficam para edição na página do evento
    const item: CertEvent = {
      id,
      nome,
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...events];
    setEvents(next);
    saveEvents(next);
    // redireciona para a página de edição/geração de certificados do evento
    router.push(`/gestao/certificados/${id}`);
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
                    {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ""}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal minimalista: só nome */}
      <CreateCertEventModal
        open={open}
        onOpenChange={setOpen}
        onCreate={handleCreate}
      />
    </main>
  );
}
