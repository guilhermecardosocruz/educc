import Link from "next/link";
import { prisma } from "@/lib/prisma";

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
          <Link
            href="/classes"
            className="mt-4 inline-flex rounded-xl bg-[#0A66FF] px-4 py-2 text-white shadow hover:opacity-90"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const attendances = await prisma.attendance.findMany({
    where: { classId: cls.id },
    orderBy: [{ seq: "desc" }],
    select: { seq: true, title: true }
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Cabeçalho */}
      <div className="rounded-2xl border bg-white/90 backdrop-blur p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/classes/${cls.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0A66FF]"
            >
              Voltar
            </Link>
          </div>

          <div className="text-right">
            <h1 className="text-xl font-semibold text-gray-900">
              Chamadas — <span className="text-[#0A66FF]">{cls.name}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-600">Gerencie as chamadas desta turma.</p>
          </div>

          <Link
            href={`/classes/${cls.id}/chamadas/new`}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#0A66FF]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="-ms-1">
              <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/>
            </svg>
            Nova chamada
          </Link>
        </div>
      </div>

      {/* Lista */}
      <section className="mt-6">
        <div className="rounded-2xl border bg-white shadow-sm">
          {attendances.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-700">Ainda não há chamadas nesta turma.</p>
              <Link
                href={`/classes/${cls.id}/chamadas/new`}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#0A66FF] px-4 py-2 text-sm font-medium text-[#0A66FF] hover:bg-[#0A66FF] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#0A66FF]"
              >
                Criar primeira chamada
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-blue-100">
              {attendances.map((att) => (
                <li key={att.seq} className="odd:bg-blue-50/40 even:bg-blue-100/30">
                  <Link
                    href={`/classes/${cls.id}/chamadas/${att.seq}`}
                    className="group block px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0A66FF]"
                    title={att.title || `Chamada ${att.seq}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="truncate text-[15px] font-semibold text-gray-900">
                        {att.seq} — {att.title?.trim() ? att.title : "Sem título"}
                      </p>
                      <div className="ms-4 shrink-0 rounded-full bg-[#0A66FF]/10 p-2 text-[#0A66FF] transition group-hover:bg-[#0A66FF]/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                          <path fill="currentColor" d="M9 6l6 6l-6 6"/>
                        </svg>
                      </div>
                    </div>
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
