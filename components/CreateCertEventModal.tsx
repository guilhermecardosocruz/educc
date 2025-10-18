"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (payload: { id: string; nome: string }) => void;
};

export default function CreateCertEventModal({ open, onOpenChange, onCreate }: Props) {
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNome("");
      setSaving(false);
    }
  }, [open]);

  if (!open) return null;

  function canCreate() {
    return !!nome.trim() && !saving;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSaving(true);
    try {
      const id = `${Date.now()}`;
      onCreate({ id, nome: nome.trim() });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Novo evento</h2>
              <button
                type="button"
                className="h-8 px-3 rounded-md border hover:bg-gray-50"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </button>
            </div>

            <div className="p-5">
              <label className="text-sm font-medium">Nome do evento *</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Semana Pedagógica 2025"
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                Você poderá preencher os demais campos depois.
              </p>
            </div>

            <div className="px-5 py-4 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-10 px-4 rounded-md border hover:bg-gray-50"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canCreate()}
                className="btn-primary disabled:opacity-60"
              >
                {saving ? "Criando..." : "Criar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
