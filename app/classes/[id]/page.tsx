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
    select: { id: true, name: true }
  });
  if (!cls) notFound();

  return (
    <main className="min-h-screen">
      {/* Hero com gradiente e título da turma */}
      <section className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs/5 uppercase tracking-widest text-white/80">EDUCC</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
                Turma: <span className="opacity-95">{cls.name}</span>
              </h1>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/15 transition"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Ações principais (pílulas) */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/classes/${cls.id}/chamadas`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-brand-blue)] shadow-sm hover:shadow transition"
            >
              📋 Chamadas
            </Link>
            <Link
              href={`/classes/${cls.id}/conteudos`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-brand-blue)] shadow-sm hover:shadow transition"
            >
              📚 Conteúdos
            </Link>
          </div>
        </div>
      </section>

      {/* Corpo */}
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid gap-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold">Bem-vindo(a) à sua turma</h2>
            <p className="mt-2 text-gray-600">
              Use os botões acima para registrar presenças ou gerenciar conteúdos.
            </p>
          </div>

          {/* Espaço para atalhos/visões rápidas futuramente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-medium">Próximos passos</h3>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Criar datas de chamada e marcar presenças</li>
                <li>Adicionar materiais e tópicos em Conteúdos</li>
              </ul>
            </div>
            <div className="card p-5">
              <h3 className="font-medium">Dicas</h3>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Você pode voltar ao dashboard a qualquer momento</li>
                <li>Organize nomes de turmas com padrão (ex.: 1ºA 2025)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
