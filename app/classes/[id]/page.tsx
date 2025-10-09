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
    <main className="min-h-screen p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Turma: {cls.name}</h1>
          <Link href="/dashboard" className="text-[var(--color-brand-blue)] hover:underline">
            Voltar
          </Link>
        </div>

        <div className="card p-6 mb-6">
          <p className="text-gray-600">
            Criada em {new Date(cls.createdAt).toLocaleString()}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/classes/${cls.id}/chamadas`}
              className="btn-primary inline-flex items-center justify-center"
            >
              Chamadas
            </Link>
            <Link
              href={`/classes/${cls.id}/conteudos`}
              className="btn-primary inline-flex items-center justify-center"
            >
              Conteúdos
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-gray-700">
            Selecione uma opção acima para gerenciar esta turma.
          </p>
        </div>
      </div>
    </main>
  );
}
