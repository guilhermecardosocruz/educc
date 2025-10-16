"use client";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
};

export default function CreateClassModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setName(""); setErr(null); }
  }, [open]);

  async function handleCreate() {
    setLoading(true); setErr(null);
    try {
      const n = name.trim();
      if (n.length < 2) throw new Error("Nome da turma muito curto.");
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || data?.ok !== true) throw new Error(data?.error || "Erro ao criar turma");
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      setErr(e?.message || "Erro ao criar turma");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Criar nova turma</h2>
            <button className="p-1 rounded-md hover:bg-gray-100" onClick={() => onOpenChange(false)} aria-label="Fechar">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da turma</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Ex.: 7º Ano B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{err}</div>}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-60"
              onClick={handleCreate}
              disabled={loading || name.trim().length < 2}
            >
              {loading ? "Salvando..." : "Criar turma"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
