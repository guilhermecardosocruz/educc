import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

type Params = { id: string };

export default async function ChamadasPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;

  // Confere se a turma existe
  const cls = await prisma.class.findUnique({
    where: { id },
    select: { id: true, name: true }
  });
  if (!cls) return notFound();

  // Lista chamadas (ordem desc por seq)
  const chamadas = await prisma.attendance.findMany({
    where: { classId: id },
    orderBy: { seq: "desc" },
    select: { seq: true, title: true, createdAt: true }
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-4 text-sm">
        <Link href={`/classes/${id}`} className="group block rounded-lg px-4 py-3 odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">Voltar para Turma</Link>
      </nav>

      <section className="rounded-2xl border bg-white/90 shadow-soft ring-1 ring-black/5 bg-white">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Chamadas — {cls.name}</h1>
            <p className="text-sm text-gray-600">Gerencie as chamadas desta turma.</p>
          </div>
          <Link href={`/classes/${id}/chamadas/new`} className="group block rounded-lg px-4 py-3 odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
            Nova chamada
          </Link>
        </div>

        <div className="px-5 py-5">
          {chamadas.length === 0 ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-sm text-gray-700 bg-white">
              Nenhuma chamada criada ainda. Clique em <b>Nova chamada</b> para começar.
            </div>
          ) : (
            <ul className="divide-y rounded-2xl border divide-blue-200 bg-white divide-blue-200">
              {chamadas.map((c) => (
                <li key={c.seq} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {c.title?.length ? c.title : `Chamada #${c.seq}`}
                    </div>
                    <div className="text-xs text-gray-500">
</div>
                  </div>
                  <Link href={`/classes/${id}/chamadas/${c.seq}`} className="group block rounded-lg px-4 py-3 odd:bg-blue-50 even:bg-blue-100 hover:bg-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                    Abrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
