"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClassCard from "./ClassCard";
import CreateGroupModal from "@/components/CreateGroupModal";
import CreateClassModal from "@/components/CreateClassModal";

type Me = { ok: boolean; user?: { id: string; name: string; email: string } };
type Role = "PROFESSOR" | "GESTOR" | null;
type ClassItem = { id: string; name: string; createdAt: string; roleForMe: Role };
type GroupItem = { id: string; name: string; classesCount?: number };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);

  async function fetchMe() {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (res.status === 401) { router.push("/login"); return; }
    const data: Me = await res.json();
    setMe(data);
  }
  async function fetchClasses() {
    const res = await fetch("/api/classes", { cache: "no-store" });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json();
    if (data?.ok) setClasses(data.classes || []);
  }
  async function fetchGroups() {
    const res = await fetch("/api/class-groups", { cache: "no-store" });
    if (res.status === 401) { router.push("/login"); return; }
    const data = await res.json().catch(()=> ({}));
    if (res.ok && data?.ok) {
      setGroups((data.groups || []).map((g: any) => ({
        id: g.id, name: g.name, classesCount: g.classesCount ?? g.count ?? undefined
      })));
    }
  }

  useEffect(() => {
    (async () => {
      await fetchMe();
      await fetchClasses();
      await fetchGroups();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Carregando...</main>;
  }

  const firstName = me?.user?.name?.split(" ")[0] || "Olá";

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <header className="flex items-center justify-between max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-block h-4 w-4 rounded-full bg-[var(--color-brand-blue)]" />
          <h1 className="text-2xl font-semibold">Olá {firstName}</h1>
        </div>
        <button onClick={onLogout} className="btn-primary">Sair</button>
      </header>

      <section className="max-w-5xl mx-auto">
        {/* Ações: dois botões empilhados abrindo modais */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={() => setClassModalOpen(true)}
            >
              Criar turma
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => setGroupModalOpen(true)}
            >
              Criar grupo de turma
            </button>

            <p className="text-xs text-gray-500">
              Você poderá informar o nome e (no grupo) escolher as turmas desejadas.
            </p>
          </div>
        </div>

        {/* Listagem de grupos */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Meus grupos</h3>
          {groups.length === 0 ? (
            <p className="text-gray-600">Nenhum grupo criado ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <a
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="block border rounded-xl p-4 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold truncate">{g.name}</h3>
                    {typeof g.classesCount === 'number' ? (
                      <span className="text-xs text-gray-500">{g.classesCount} turma(s)</span>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Listagem de turmas */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Minhas turmas</h3>
          {classes.length === 0 ? (
            <p className="text-gray-600">Nenhuma turma cadastrada ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((c) => (
                <ClassCard key={c.id} cls={c as any} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modais */}
      <CreateClassModal
        open={classModalOpen}
        onOpenChange={setClassModalOpen}
        onCreated={fetchClasses}
      />
      <CreateGroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        classes={classes.map(c => ({ id: c.id, name: c.name }))}
        onCreated={fetchGroups}
      />
    </main>
  );
}
