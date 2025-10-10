import Link from "next/link";
import { notFound } from "next/navigation";
import { ImportContentsBox } from "./ui";

type ContentListItem = { id?: string; title?: string; seq?: number };

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

async function getClass(id: string) {
  try {
    const r = await fetch('/api/classes/' + id, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!r.ok) return null;
    const j = await safeJson(r);
    return j?.class ?? null; // API retorna { ok, class: {...} }
  } catch {
    return null;
  }
}

async function getContents(id: string): Promise<ContentListItem[]> {
  try {
    const r = await fetch(`/api/classes/${id}/conteudos`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!r.ok) return [];
    const j = await safeJson(r);
    return j?.list ?? j ?? [];
  } catch {
    return [];
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [cls, contents] = await Promise.all([getClass(id), getContents(id)]);
  if (!cls) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border bg-white p-8 text-center">
          <p className="text-lg font-medium text-gray-700">Turma não encontrada.</p>
          <Link href="/dashboard" className="mt-4 inline-flex rounded-xl bg-[#0A66FF] px-4 py-2 text-white shadow hover:opacity-90">
            Ir para Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Conteúdos — {cls.name}</h1>
            <p className="text-white/80 text-sm mt-1">Gerencie os conteúdos da turma</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/classes/${cls.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              Voltar
            </Link>
            <Link
              href={`/classes/${cls.id}/conteudos/new`}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-[#0A66FF] shadow hover:opacity-90"
            >
              Novo conteúdo
            </Link>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border bg-white">
          {contents.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              <p className="mb-3">Nenhum conteúdo cadastrado.</p>
              <p className="text-sm">Use <b>Novo conteúdo</b> ou <b>Importar por planilha</b> abaixo.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {contents.map((c, idx) => (
                <li key={c.id ?? String(idx)}>
                  <Link
                    href={`/classes/${cls.id}/conteudos/${c.seq ?? c.id}`}
                    className={`group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 hover:bg-blue-50 ${idx % 2 ? "bg-blue-50/50" : "bg-white"}`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A66FF]/10 text-[#0A66FF] font-semibold">
                      {c.seq ?? "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{c.title ?? "Sem título"}</p>
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
        </div>

        {/* Importação de conteúdos por planilha */}
        <div className="mt-8">
          <ImportContentsBox classId={cls.id} />
        </div>
      </section>
    </main>
  );
}
