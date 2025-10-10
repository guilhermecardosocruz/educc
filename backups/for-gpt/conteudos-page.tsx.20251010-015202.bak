import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function ConteudosListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({ where: { id, ownerId: user.id }, select: { id: true, name: true } });
  if (!cls) notFound();

  const items = await prisma.content.findMany({
    where: { classId: id },
    orderBy: { seq: "desc" },
    select: { seq: true, title: true }
  });

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs/5 uppercase tracking-widest text-white/80">EDUCC</p>
              <h1 className="text-2xl font-bold">Conteúdos • {cls.name}</h1>
            </div>
            <Link href={`/classes/${cls.id}`} className="rounded-xl bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/15">← Turma</Link>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.length === 0 ? (
              <p className="text-white/90">Ainda não há conteúdos.</p>
            ) : items.map((c) => (
              <Link key={c.seq} href={`/classes/${cls.id}/conteudos/${c.seq}`} className="aspect-square rounded-2xl bg-white/10 hover:bg-white/20 transition p-4 flex items-end">
                <div className="text-sm font-semibold">#{c.seq} — {c.title}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
