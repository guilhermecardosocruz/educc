"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClassCard from "./ClassCard";
import CreateGroupModal from "@/components/CreateGroupModal";

type Me = { ok: boolean; user?: { id: string; name: string; email: string } };
type Role = "PROFESSOR" | "GESTOR" | null;
type ClassItem = { id: string; name: string; createdAt: string; roleForMe: Role };
type GroupItem = { id: string; name: string; createdAt: string };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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
    const data = await res.json();
    if (data?.ok) setGroups(data.groups || []);
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

  async function onCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const n = name.trim();
    if (n.length < 2) { setErr("Nome da turma muito curto."); return; }
    const res = await fetch("/api/classes", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: n })
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) { setErr(data?.error ?? "Erro ao criar turma"); return; }
    setName("");
    await fetchClasses();
  }

  if (loading) return <main className="min-h-screen flex items-center justify-center">Carregando...</main>;

  const firstName = me?.user?.name?.split(" ")[0] || "Olá";
  const visibleClasses = selectedGroupId ? null : classes;

  return (
    <main className="min-h-screen p-6 lg:p-10">
      <header className="flex items-center justify-between max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <span className="inline-block h-4 w-4 rounded-full bg-[var(--color-brand-blue)]" />
          <h1 className="text-2xl font-semibold">EDUCC • Dashboard</h1>
        </div>
        <button onClick={onLogout} className="btn-primary">Sair</button>
      </header>

      <section className="max-w-5xl mx-auto">
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold">{firstName}, bem-vindo(a)!</h2>
          <p className="text-gray-600">Gerencie suas turmas e grupos abaixo.</p>
        </div>

        {/* Grupos */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Grupos</h3>
            <button className="btn-secondary" onClick={() => setCreateOpen(true)}>Criar grupo</button>
          </div>

          {groups.length === 0 ? (
            <p className="text-gray-600">Você ainda não tem grupos.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {groups.map(g => (
                <button
                  key={g.id}
                  className={`px-3 py-1.5 rounded-xl border text-sm ${selectedGroupId === g.id ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}
                  onClick={async () => {
                    setSelectedGroupId(prev => prev === g.id ? null : g.id);
                    // Filtra via client navegando para página? Aqui só alterna seleção e deixa a listagem abaixo cuidar.
                    // Em produção poderíamos buscar endpoint /api/groups/{id}/classes, mas para simplicidade, filtramos no card modal ao vincular.
                  }}
                >
                  {g.name}
                </button>
              ))}
              {selectedGroupId && (
                <button className="px-3 py-1.5 rounded-xl border text-sm hover:bg-gray-50" onClick={() => setSelectedGroupId(null)}>
                  Limpar filtro
                </button>
              )}
            </div>
          )}
        </div>

        {/* Criar turma */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold mb-3">Criar nova turma</h3>
          <form onSubmit={onCreateClass} className="flex flex-col sm:flex-row gap-3">
            <input
              className="input flex-1"
              type="text"
              placeholder="Nome da turma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
            <button type="submit" className="btn-primary">Criar turma</button>
          </form>
          {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
        </div>

        {/* Minhas turmas */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Minhas turmas</h3>
          {classes.length === 0 ? (
            <p className="text-gray-600">Nenhuma turma cadastrada ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(visibleClasses ?? classes).map((c) => (
                <ClassCard key={c.id} cls={c as any} filterGroupId={selectedGroupId} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CreateGroupModal
        open={createOpen}
        onOpenChange={(v) => { setCreateOpen(v); }}
        classes={classes.map(c => ({ id: c.id, name: c.name }))}
        onCreated={async () => { await fetchGroups(); }}
      />
    </main>
  );
}
