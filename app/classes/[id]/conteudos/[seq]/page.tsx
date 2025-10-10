"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Content = { id: string; seq: number; title: string; bodyHtml?: string };

export default function ConteudoDetailPage() {
  const { id, seq } = useParams<{ id: string; seq: string }>();
  const [data, setData] = useState<Content | null>(null);
  const [err, setErr] = useState<string|null>(null);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/classes/${id}/conteudos/${seq}`, { cache: "no-store" });
        const j = await res.json().catch(()=> ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || "Não encontrado");
        setData(j.content);
      } catch(e:any) {
        setErr(e?.message || "Erro ao carregar conteúdo");
      }
    }
    if (id && seq) run();
  }, [id, seq]);

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
        <article className="prose max-w-none rounded-2xl border bg-white p-6 prose-h3:mt-4">
          <h1 className="!mb-2 text-2xl font-semibold">{data.title}</h1>
          <div className="text-sm text-gray-500">Conteúdo da Aula</div>
          <div className="mt-4" dangerouslySetInnerHTML={{ __html: data.bodyHtml ?? "<p>Sem detalhes registrados.</p>" }} />
        </article>
      )}
    </main>
  );
}
