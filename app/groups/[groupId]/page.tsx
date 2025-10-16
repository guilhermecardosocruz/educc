'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

type ClassLite = { id: string; name: string };
type GroupDetail = { id: string; name: string; classes: ClassLite[] };

export default function GroupPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const groupId = params?.groupId as string;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/class-groups/${groupId}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? 'Falha ao carregar grupo');
      const g = data.group as GroupDetail;
      setGroup({ id: g.id, name: g.name, classes: data.classes ?? g.classes ?? [] });
    } catch (e: any) {
      setErr(e?.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Carregando...
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="card p-6">
          <p className="text-red-600">{err}</p>
          <div className="mt-4">
            <button onClick={() => router.back()} className="btn-primary">Voltar</button>
          </div>
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="card p-6">
          <p className="text-gray-600">Grupo não encontrado.</p>
          <div className="mt-4">
            <button onClick={() => router.back()} className="btn-primary">Voltar</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <header className="flex items-center justify-between max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border hover:bg-gray-50"
            aria-label="Voltar"
            title="Voltar"
          >
            ← Voltar
          </button>
          <h1 className="text-xl font-semibold">Grupo: {group.name}</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-[var(--color-brand-blue)] hover:underline">
          Ir para Dashboard
        </Link>
      </header>

      <section className="max-w-5xl mx-auto">
        {/* Turmas do grupo (clicáveis) */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-3">Turmas deste grupo</h2>
          {group.classes?.length ? (
            <div className="flex flex-wrap gap-2">
              {group.classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/classes/${c.id}`}
                  className="px-3 py-1.5 rounded-full border hover:bg-gray-50 text-sm"
                  title={`Abrir turma: ${c.name}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Nenhuma turma vinculada a este grupo.</p>
          )}
        </div>

        {/* Placeholder de relatórios */}
        <div className="card p-6">
          <h2 className="font-semibold mb-2">Relatórios</h2>
          <p className="text-gray-600">
            Aqui haverá relatórios.
          </p>
        </div>
      </section>
    </main>
  );
}
