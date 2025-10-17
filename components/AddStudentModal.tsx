"use client";
import { useState } from "react";

type Student = { id: string; name: string; cpf?: string | null; contact?: string | null };

type Props = {
  classId: string;
  open: boolean;
  onClose: () => void;
  onAdded?: (student: Student) => void;
};

export default function AddStudentModal({ classId, open, onClose, onAdded }: Props) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    const n = name.trim();
    if (n.length < 2) {
      alert("Informe o nome (mínimo 2 caracteres).");
      return;
    }
    setSubmitting(true);
    try {
      const body: any = { name: n };
      const c = cpf.trim(); if (c) body.cpf = c;
      const ct = contact.trim(); if (ct) body.contact = ct;

      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.ok) {
        const e = payload?.error;
        throw new Error(typeof e === "string" ? e : "Erro ao adicionar aluno");
      }
      onAdded?.(payload.student);
      setName(""); setCpf(""); setContact("");
      onClose();
    } catch (e: any) {
      alert(e?.message || "Erro ao adicionar aluno");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900">Adicionar aluno</h2>

        <div className="mt-3 grid gap-3">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-gray-700">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Maria Silva"
              className="w-full rounded-xl border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              autoFocus
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-gray-700">CPF (opcional)</label>
            <input
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="Somente números"
              className="w-full rounded-xl border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-gray-700">Contato (opcional)</label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Ex.: (48) 99999-9999"
              className="w-full rounded-xl border border-blue-200 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || name.trim().length < 2}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Adicionando..." : "Salvar aluno"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
