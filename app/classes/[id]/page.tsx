import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, name: true, createdAt: true }
  });
  if (!cls) notFound();

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <p className="text-xs/5 uppercase tracking-widest text-white/80">EDUCC</p>
          <Link href={`/`} className="inline-flex items-center gap-2 rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0A66FF]">Voltar</Link>
            <h1 className="text-2xl font-bold">{cls.name}</h1>
          </div>
          <div className="flex gap-2">
            
            
          </div>
        </div>
      </section>

      {/* Corpo simplificado: sem StudentsPanel (edição/import de alunos saiu da Turma) */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-2">Ações</h2>
          <p className="text-gray-600 mb-4">Gerencie a turma acessando Chamadas e Conteúdos.</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/classes/${cls.id}/chamadas`} className="btn-primary">Ir para Chamadas</Link>
            <Link href={`/classes/${cls.id}/conteudos`} className="rounded-xl border px-4 py-3">Ver Conteúdos</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
