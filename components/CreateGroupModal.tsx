"use client";
import { useEffect, useState } from "react";

type ClassItem = { id: string; name: string };
type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassItem[];
  onCreated?: () => void;
};

export default function CreateGroupModal({ open, onOpenChange, classes, onCreated }: Props) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setName(""); setSelected({}); setErr(null); }
  }, [open]);

  async function handleCreate() {
    setLoading(true); setErr(null);
    try {
      const classIds = Object.entries(selected).filter(([,v]) => v).map(([k]) => k);
      const res = await fetch("/api/class-groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), classIds })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao criar grupo");
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      setErr(e?.message || "Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Criar grupo de turma</h2>
            <button className="p-1 rounded-md hover:bg-gray-100" onClick={() => onOpenChange(false)} aria-label="Fechar">✕</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do grupo</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: 1º semestre 2026"
              />
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Selecionar turmas (opcional)</div>
              <div className="max-h-48 overflow-auto border rounded-md divide-y">
                {classes.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Você ainda não tem turmas.</div>
                ) : classes.map(c => (
                  <label key={c.id} className="flex items-center gap-2 p-2">
                    <input
                      type="checkbox"
                      checked={!!selected[c.id]}
                      onChange={(e) => setSelected(s => ({ ...s, [c.id]: e.target.checked }))}
                    />
                    <span className="text-sm">{c.name}</span>
                  </label>
                ))}
              </div>
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
              {loading ? "Salvando..." : "Criar grupo de turma"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
