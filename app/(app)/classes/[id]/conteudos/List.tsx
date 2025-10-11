"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Content = {
  seq: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

export default function ConteudosList({ classId }: { classId: string }) {
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
      console.error(e);
      alert(e?.message || "Erro ao carregar conteúdos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [classId]);

  if (loading) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-gray-600">Carregando…</div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      {items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center text-gray-700">
          Nenhum conteúdo ainda. Use “Importar conteúdos por planilha”.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-2xl border bg-white">
          {items.map((c, idx) => (
            <li key={c.seq} className={idx % 2 ? "bg-blue-50/40" : "bg-white"}>
              <Link
                href={`/classes/${classId}/conteudos/${c.seq}`}
                className="group flex items-center justify-between px-4 py-4 hover:bg-blue-50"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="rounded-xl bg-[#0A66FF]/10 px-3 py-1.5 text-xs font-medium text-[#0A66FF]">
                    {c.seq}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {c.title || `Conteúdo ${c.seq}`}
                    </p>
                    {c.description && (
                      <p className="truncate text-xs text-gray-600">{c.description}</p>
                    )}
                  </div>
                </div>

                <div className="ms-4 shrink-0 rounded-full bg-[#0A66FF]/10 p-2 text-[#0A66FF] transition group-hover:bg-[#0A66FF]/20">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M9 6l6 6l-6 6"/>
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
