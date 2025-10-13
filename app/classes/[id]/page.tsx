import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportButton from "./ReportButton"; // ✅ único import novo

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cls = await prisma.class.findFirst({
    where: { id },
    select: { id: true, name: true }
  });
  if (!cls) return notFound();

  return (
    <main className="min-h-screen">
      {/* Cabeçalho */}
      <section className="bg-gradient-to-br from-[#0A66FF]/90 to-[#0A66FF] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between gap-3">
          <Link
            href={`/dashboard`}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60"
          >
            Voltar
          </Link>

          <div className="text-right">
            <h1 className="text-xl font-semibold">
              Turma — <span className="opacity-95">{cls.name}</span>
            </h1>
            <p className="mt-1 text-sm opacity-90">Gerencie a turma acessando Chamadas e Conteúdos.</p>
          </div>
        </div>
      </section>

      {/* Corpo */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Ações</h2>
          <p className="text-gray-600 mb-4">Use os atalhos abaixo para gerenciar a turma.</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/classes/${cls.id}/chamadas`}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
            >
              Ir para Chamadas
            </Link>
            <Link
              href={`/classes/${cls.id}/conteudos`}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
            >
              Ver Conteúdos
            </Link>
            {/* 🔹 Botão/Modal/PDF */}
            <ReportButton classId={cls.id} className={cls.name} />
            {/* 🔹 Ajuda com IA */}
            <Link
              href={`/classes/${cls.id}/ai-help`}
              className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-800 hover:border-blue-400 hover:text-blue-700"
            >
              Ajuda com IA
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
