import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ChamadasClient from "./ui";

export default async function ChamadasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, name: true }
  });
  if (!cls) notFound();

  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-br from-[var(--color-brand-blue)]/90 to-[var(--color-brand-blue)] text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs/5 uppercase tracking-widest text-white/80">EDUCC</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold">
                Chamadas • <span className="opacity-95">{cls.name}</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/classes/${cls.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/15 transition"
              >
                ← Turma
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/15 transition"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <ChamadasClient classId={cls.id} />
        </div>
      </section>
    </main>
  );
}
