import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ClassPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({
    where: { id: params.id, ownerId: user.id },
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
        <div className="card p-6">
          <p className="text-gray-600">
            Criada em {new Date(cls.createdAt).toLocaleString()}.
          </p>
          <p className="mt-2 text-gray-700">
            (Placeholder) Aqui você poderá gerenciar alunos, conteúdos, etc.
          </p>
        </div>
      </div>
    </main>
  );
}
