import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NewChamadaClient from "./ui";
import Actions from "./Actions";
import ImportBox from "./ImportBox";

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
            <input id="title" className="input w-full" placeholder="Ex.: Aula 01 - Introdução" />
          </div>

          {/* ações (client) */}
          <Actions classId={cls.id} />

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

          {/* criar chamada (client) */}
          <NewChamadaClient classId={cls.id} />

          {/* importação (client) */}
          <ImportBox classId={cls.id} />
        </div>
      </section>
    </main>
  );
}
