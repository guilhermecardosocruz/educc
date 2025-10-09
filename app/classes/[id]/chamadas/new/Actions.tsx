"use client";

export default function Actions({ classId }: { classId: string }) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        type="button"
        className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => window.open('#', '_blank')}
        title="Abrirá o conteúdo desta chamada em nova aba após a criação"
      >
        Conteúdo
      </button>
      <button
        type="button"
        className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => alert('Você pode adicionar alunos pela seção de importação abaixo ou na tela da turma.')}
      >
        Adicionar aluno
      </button>
    </div>
  );
}
