"use client";
import { useEffect, useMemo, useState } from "react";

type Item = { id: string; seq: number; title: string; createdAt: string };
type Order = "asc" | "desc";

export default function ChamadasClient({ classId }: { classId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState<Order>("desc");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/classes/${classId}/chamadas?order=${order}`, { cache: "no-store" });
    if (!res.ok) {
      setError("Falha ao carregar chamadas");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setItems(data?.attendances ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [order, classId]);

  async function createOne() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/classes/${classId}/chamadas`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Erro ao criar chamada");
      } else {
        // inserir no estado conforme a ordenação atual
        const created: Item = data.attendance;
        setItems((prev) => order === "desc" ? [created, ...prev] : [...prev, created]);
      }
    } catch {
      setError("Falha de rede ao criar chamada");
    } finally {
      setCreating(false);
    }
  }

  const sorted = useMemo(() => {
    // já vem ordenado pela API; isto é redundante, mas mantém robustez
    return [...items].sort((a,b) => order === "asc" ? a.seq - b.seq : b.seq - a.seq);
  }, [items, order]);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={createOne}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-brand-blue)] shadow-sm hover:shadow transition disabled:opacity-60"
        >
          {creating ? "Criando..." : "➕ Nova chamada"}
        </button>

        <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur">
          <span className="opacity-90">Ordenar por ID:</span>
          <button
            onClick={() => setOrder("asc")}
            className={`rounded-xl px-3 py-1 ${order==="asc" ? "bg-white text-[var(--color-brand-blue)] shadow" : "text-white/90 hover:bg-white/10"}`}
            aria-pressed={order==="asc"}
          >
            Crescente
          </button>
          <button
            onClick={() => setOrder("desc")}
            className={`rounded-xl px-3 py-1 ${order==="desc" ? "bg-white text-[var(--color-brand-blue)] shadow" : "text-white/90 hover:bg-white/10"}`}
            aria-pressed={order==="desc"}
          >
            Decrescente
          </button>
        </div>
      </div>

      <div className="mt-5 bg-white/5 rounded-2xl p-1">
        {loading ? (
          <div className="p-6 text-white/90">Carregando chamadas...</div>
        ) : error ? (
          <div className="p-6 text-red-100">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="p-6 text-white/90">Nenhuma chamada ainda. Crie a primeira.</div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-2">
            {sorted.map((it) => (
              <li key={it.id}>
                <button
                  className="w-full text-left rounded-xl bg-white px-4 py-3 shadow-sm hover:shadow transition border border-white/70"
                  // futuro: onClick -> navegar para detalhe da chamada
                  onClick={() => {}}
                >
                  <div className="text-sm text-[var(--color-brand-blue)] font-semibold">ID #{it.seq}</div>
                  <div className="font-medium">{it.title}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
