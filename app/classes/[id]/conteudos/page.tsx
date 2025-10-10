import Link from "next/link";
import { notFound } from "next/navigation";
import { ImportContentsBox } from "./ui";

type ContentListItem = { seq?: number; title?: string; id?: string };

async function getClass(id: string) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/classes/${id}`, { cache: "no-store" });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  return j?.cls ?? null;
}

async function getContents(id: string): Promise<ContentListItem[]> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/classes/${id}/conteudos`, { cache: "no-store" });
  if (!r.ok) return [];
  const j = await r.json().catch(() => null);
  // aceita {list: [...] } ou array direto
  return j?.list ?? j ?? [];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [cls, contents] = await Promise.all([getClass(id), getContents(id)]);
  if (!cls) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* Cabeçalho */}
      <section className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Link
              href={`/classes/${cls.id}`}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
            >
              Voltar
            </Link>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700"
              >
                Sair
              </button>
            </form>
          </div>

          <Link
            href={`/classes/${cls.id}/conteudos/new`}
            className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
          >
            Novo conteúdo
          </Link>
        </div>

        <div className="mt-4 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Conteúdos — <span className="text-[#0A66FF]">{cls.name}</span>
          </h1>
          <p className="mt-1 text-gray-600">Visualize e gerencie os conteúdos desta turma.</p>
        </div>
      </section>

      {/* Lista de conteúdos (somente título, linha clicável) */}
      <section className="mt-6 rounded-2xl border bg-white">
        {contents.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-600">Nenhum conteúdo ainda.</div>
        ) : (
          <ul className="divide-y rounded-2xl">
            {contents.map((c, idx) => (
              <li key={c.id ?? c.seq ?? idx} className={idx % 2 ? "bg-blue-50/40" : ""}>
                <Link
                  href={`/classes/${cls.id}/conteudos/${c.seq ?? idx + 1}`}
                  className="group flex items-center justify-between px-5 py-4 hover:bg-blue-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-gray-900">
                      {c.title ?? `Conteúdo ${c.seq ?? idx + 1}`}
                    </p>
                  </div>
                  <div className="ms-4 shrink-0 rounded-full bg-[#0A66FF]/10 p-2 text-[#0A66FF] transition group-hover:bg-[#0A66FF]/20">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path fill="currentColor" d="M9 6l6 6l-6 6"/>
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Importar por planilha (idêntico ao de aluno) */}
      <ImportContentsBox classId={cls.id} />
    </main>
  );
}
