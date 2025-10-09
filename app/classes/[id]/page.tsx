import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import StudentsPanel from "./StudentsPanel";

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
    <main className="min-h-screen">
      <section className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <p className="text-xs/5 uppercase tracking-widest text-white/80">EDUCC</p>
            <h1 className="text-2xl font-bold">{cls.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/classes/${cls.id}/chamadas`} className="rounded-xl bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/15">Chamadas</Link>
            <Link href={`/classes/${cls.id}/conteudos`} className="rounded-xl bg-white/10 px-4 py-2 text-sm backdrop-blur hover:bg-white/15">Conteúdos</Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6">
        <StudentsPanel classId={cls.id} />
      </div>
    </main>
  );
}
