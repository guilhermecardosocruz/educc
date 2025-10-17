"use client";
import { useEffect, useRef, useState } from "react";
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

  const [groupMenuOpen, setGroupMenuOpen] = useState<string | null>(null);
  const groupMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!groupMenuRef.current) return;
      if (!groupMenuRef.current.contains(e.target as Node)) {
        setGroupMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

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

  async function onDeleteGroup(g: GroupItem) {
    if (!confirm(`Excluir o grupo "${g.name}"?`)) return;
    const res = await fetch(`/api/class-groups/${g.id}`, { method: "DELETE" });
    const data = await res.json().catch(()=> ({}));
    if (!res.ok || data?.ok === false) {
      alert(data?.error || "Erro ao excluir grupo");
      return;
    }
    await fetchGroups();
  }

  async function onRenameGroup(g: GroupItem) {
    const next = prompt("Novo nome do grupo:", g.name)?.trim();
    if (!next || next === g.name) return;
    const res = await fetch(`/api/class-groups/${g.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: next })
    });
    const data = await res.json().catch(()=> ({}));
    if (!res.ok || data?.ok === false) {
      alert(data?.error || "Erro ao renomear grupo");
      return;
    }
    await fetchGroups();
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
        <div className="card p-6 mb-6">
          <div className="flex flex-col gap-3">
            <button type="button" className="btn-primary" onClick={() => setClassModalOpen(true)}>
              Criar turma
            </button>
            <button type="button" className="btn-primary" onClick={() => setGroupModalOpen(true)}>
              Criar grupo de turma
            </button>
            <p className="text-xs text-gray-500">
              Você poderá informar o nome e (no grupo) escolher as turmas desejadas.
            </p>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-4">Meus grupos</h3>
          {groups.length === 0 ? (
            <p className="text-gray-600">Nenhum grupo criado ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" ref={groupMenuRef}>
              {groups.map((g) => (
                <div key={g.id} className="relative">
                  <a
                    href={`/groups/${g.id}`}
                    className="block border rounded-xl p-4 pr-12 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold truncate">{g.name}</h3>
                      {typeof g.classesCount === "number" ? (
                        <span className="text-xs text-gray-500">{g.classesCount} turma(s)</span>
                      ) : null}
                    </div>
                  </a>

                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 border border-gray-200"
                      aria-label="Mais ações"
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setGroupMenuOpen((id) => (id === g.id ? null : g.id));
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="12" cy="5" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="12" cy="19" r="1.8" />
                      </svg>
                    </button>

                    {groupMenuOpen === g.id && (
                      <div
                        className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md z-20"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          onClick={() => { setGroupMenuOpen(null); onRenameGroup(g); }}
                        >
                          Renomear
                        </button>
                        <div className="my-1 border-t" />
                        <button
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          onClick={() => { setGroupMenuOpen(null); onDeleteGroup(g); }}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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

      <CreateClassModal open={classModalOpen} onOpenChange={setClassModalOpen} onCreated={fetchClasses} />
      <CreateGroupModal
        open={groupModalOpen}
        onOpenChange={setGroupModalOpen}
        classes={classes.map(c => ({ id: c.id, name: c.name }))}
        onCreated={fetchGroups}
      />
    </main>
  );
}
