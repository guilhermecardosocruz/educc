import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NewChamadaClient from "./ui";

export default async function NewChamadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, name: true }
  });
  if (!cls) notFound();

  const students = await prisma.student.findMany({
    where: { classId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true }
  });

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full bg-[var(--color-brand-blue)]" />
            <span className="font-semibold">EDUCC</span>
          </div>
          <div className="flex gap-2">
            <Link href={`/classes/${cls.id}/chamadas`} className="rounded-xl px-3 py-2 text-sm border">Cancelar</Link>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="card p-6">
          <h1 className="text-lg font-semibold">Nova chamada</h1>

          <div className="mt-4">
            <label className="block text-sm text-gray-600 mb-1">Nome da aula</label>
            <input
              id="title"
              className="input w-full"
              placeholder="Ex.: Aula 01 - Introdução"
            />
          </div>

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

          <div className="mt-4 grid gap-2">
            {students.length === 0 ? (
              <div className="rounded-xl border px-4 py-3 text-sm text-gray-600">
                Nenhum aluno na turma ainda.
              </div>
            ) : students.map((s) => (
              <label key={s.id} className="flex items-center justify-between rounded-xl border px-4 py-3 bg-gradient-to-br from-[var(--color-brand-blue)]/8 to-[var(--color-brand-blue)]/4">
                <span className="capitalize">{s.name}</span>
                <span className="inline-flex items-center gap-2 text-sm">
                  Presente
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-[var(--color-brand-blue)]" />
                </span>
              </label>
            ))}
          </div>

          <NewChamadaClient classId={cls.id} />

          <div className="mt-6 border rounded-2xl p-4">
            <h2 className="font-medium">Adicionar alunos por planilha</h2>
            <p className="text-sm text-gray-600 mt-1">
              CSV ou XLSX com colunas: <b>name</b> (obrigatório), <b>cpf</b> e <b>contact</b> (opcionais).
            </p>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border-2 border-dashed p-8 text-center text-sm text-gray-600">
                <div className="text-3xl">+</div>
                <p className="mt-1">Clique para selecionar ou arraste seu arquivo aqui</p>
                <p className="text-xs mt-1">Formatos aceitos: CSV, XLSX</p>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="mt-3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("file", file);
                    fetch(`/api/classes/${cls.id}/students/import`, { method: "POST", body: fd })
                      .then(r => r.json())
                      .then(d => alert(d?.ok ? `Importados: ${d.createdCount}` : (d?.error ?? 'Erro ao importar')))
                      .catch(() => alert('Falha de rede'));
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.csv" target="_blank">Baixar modelo CSV</a>
                <a className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50" href="/templates/students.xlsx" target="_blank">Baixar modelo XLSX</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
