import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ConteudosList from "./List";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cls = await prisma.class.findFirst({
    where: { id },
    select: { id: true, name: true }
  });

  if (!cls) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-lg font-medium text-gray-700">Turma não encontrada.</p>
          <Link href="/dashboard" className="mt-4 inline-flex rounded-xl bg-[#0A66FF] px-4 py-2 text-white shadow hover:opacity-90">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Cabeçalho no mesmo padrão da página de Chamadas */}
      <section className="rounded-2xl border bg-white/90 backdrop-blur p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/classes/${cls.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0A66FF]">
            Voltar
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão solicitado: Importar por planilha */}
            <Link
              href={`/classes/${cls.id}/conteudos/import`}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600"
            >
            <Link
              href={`/classes/${cls.id}/conteudos/new`}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
            >
              Adicionar conteúdo
            </Link>
              Importar conteúdos por planilha
            </Link>
          </div>

          <div className="text-right">
            <h1 className="text-xl font-semibold text-gray-900">
              Conteúdos — <span className="text-[#0A66FF]">{cls.name}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-600">Visualize e gerencie os conteúdos desta turma.</p>
          </div>
        </div>
      </section>

      {/* Lista clonada no estilo da de Chamadas (render cliente) */}
      <ConteudosList classId={cls.id} />
    </main>
  );
}
