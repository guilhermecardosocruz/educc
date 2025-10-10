"use client";
import { useEffect, useState } from "react";

type Content = {
  seq: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt?: string;
};

export default function ConteudosFeed({ classId }: { classId: string }) {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/conteudos`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data)) throw new Error("Falha ao carregar conteúdos");
      setItems(data);
    } catch (e: any) {
      alert(e?.message || "Erro ao carregar conteúdos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onCreated = () => load();
    window.addEventListener("conteudo:created", onCreated);
    return () => window.removeEventListener("conteudo:created", onCreated);
  }, []);

  if (loading) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-gray-600">Carregando…</div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center text-gray-700">
          Nenhum conteúdo ainda. Clique em “Adicionar conteúdo” no topo.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-6">
      {items.map((c) => (
        <article key={c.seq} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={c.title} className="w-full max-h-[420px] object-cover" />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-blue-50 text-blue-700">Imagem gerada pela IA ausente</div>
          )}
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-900">
              {c.seq} — {c.title}
            </h3>
            {c.description && (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
