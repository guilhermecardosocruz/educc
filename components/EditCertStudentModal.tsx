"use client";

import { useEffect, useState } from "react";

export type CertStudent = {
  aluno_nome: string;
  aluno_doc?: string;
  turma?: string;
  carga_horaria?: string;
  observacoes?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  student: CertStudent | null;
  index: number;
  onSave: (updated: CertStudent, index: number) => void;
  onDelete: (index: number) => void;
  onGenerateOne: (index: number) => void;
};

export default function EditCertStudentModal({
  open,
  onOpenChange,
  student,
  index,
  onSave,
  onDelete,
  onGenerateOne,
}: Props) {
  const [form, setForm] = useState<CertStudent>({
    aluno_nome: "",
    aluno_doc: "",
    turma: "",
    carga_horaria: "",
    observacoes: "",
  });

  useEffect(() => {
    if (open && student) {
      setForm({
        aluno_nome: student.aluno_nome || "",
        aluno_doc: student.aluno_doc || "",
        turma: student.turma || "",
        carga_horaria: student.carga_horaria || "",
        observacoes: student.observacoes || "",
      });
    }
  }, [open, student]);

  if (!open) return null;

  function canSave() {
    return !!form.aluno_nome.trim();
  }

  function backdrop() {
    onOpenChange(false);
  }
  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div className="fixed inset-0 z-50" onClick={backdrop}>
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-xl bg-white shadow-lg" onClick={stop}>
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Editar aluno</h2>
            <button
              type="button"
              className="h-8 px-3 rounded-md border hover:bg-gray-50"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Nome *</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.aluno_nome}
                onChange={(e) => setForm((f) => ({ ...f, aluno_nome: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium">Documento</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.aluno_doc || ""}
                onChange={(e) => setForm((f) => ({ ...f, aluno_doc: e.target.value }))}
                placeholder="CPF (opcional)"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Turma</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.turma || ""}
                onChange={(e) => setForm((f) => ({ ...f, turma: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Carga horária</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2"
                value={form.carga_horaria || ""}
                onChange={(e) => setForm((f) => ({ ...f, carga_horaria: e.target.value }))}
                placeholder="Ex.: 08h"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea
                className="mt-1 w-full rounded-md border px-3 py-2"
                rows={3}
                value={form.observacoes || ""}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </div>
          </div>

          <div className="px-5 py-4 border-t flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-10 px-4 rounded-md border hover:bg-gray-50"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary disabled:opacity-60"
                disabled={!canSave()}
                onClick={() => onSave(form, index)}
              >
                Salvar
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-10 px-4 rounded-md border hover:bg-gray-50"
                onClick={() => onGenerateOne(index)}
                title="Gerar PDF apenas para este aluno"
              >
                Gerar este certificado
              </button>
              <button
                type="button"
                className="h-10 px-4 rounded-md border text-red-600 hover:bg-red-50"
                onClick={() => onDelete(index)}
                title="Excluir aluno"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
