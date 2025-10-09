import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ConteudosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, name: true }
  });
  if (!cls) notFound();

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Conteúdos • {cls.name}</h1>
          <div className="flex gap-4">
            <Link href={`/classes/${cls.id}`} className="text-[var(--color-brand-blue)] hover:underline">Turma</Link>
            <Link href={`/classes/${cls.id}/chamadas`} className="text-[var(--color-brand-blue)] hover:underline">Chamadas</Link>
            <Link href="/dashboard" className="text-[var(--color-brand-blue)] hover:underline">Dashboard</Link>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-gray-700">
            (Placeholder) Aqui você poderá cadastrar conteúdos, anexar materiais, organizar tópicos, etc.
          </p>
        </div>
      </div>
    </main>
  );
}
