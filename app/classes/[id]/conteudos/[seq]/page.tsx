import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ContentPage({ params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;

  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true, name: true } });
  if (!cls) notFound();

  const content = await prisma.content.findUnique({
    where: { classId_seq: { classId: id, seq: Number(seq) } },
    select: { seq: true, title: true, bodyHtml: true }
  });

  return (
    <main className="min-h-screen bg-neutral-100">
      <header className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <p className="text-xs/5 uppercase tracking-widest text-white/80">EDUCC</p>
            <h1 className="text-xl font-bold">Conteúdo • {cls.name} • #{seq}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/classes/${cls.id}/chamadas/${seq}`} className="rounded-xl bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/15">← Chamada</Link>
            <Link href={`/classes/${cls.id}/conteudos`} className="rounded-xl bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/15">Todos os conteúdos</Link>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6 min-h-[60vh]">
          {content ? (
            <>
              <h2 className="text-lg font-semibold mb-4">{content.title}</h2>
              {content.bodyHtml ? (
                <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content.bodyHtml }} />
              ) : (
                <p className="text-gray-600">Sem conteúdo.</p>
              )}
            </>
          ) : (
            <p className="text-gray-600">Sem conteúdo.</p>
          )}
        </div>
      </section>
    </main>
  );
}
