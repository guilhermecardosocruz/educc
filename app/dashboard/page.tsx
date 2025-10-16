"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClassCard from "./ClassCard";

type Me = { ok: boolean; user?: { id: string; name: string; email: string } };
type ClassItem = { id: string; name: string; createdAt: string; role: "PROFESSOR" | "GESTOR" | null };

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);

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
    if (data?.ok) setClasses((data.classes || []) as ClassItem[]);
  }

  useEffect(() => {
    (async () => {
      await fetchMe();
      await fetchClasses();
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
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: n })
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) { setErr(data?.error ?? "Erro ao criar turma"); return; }
    setName("");
    await fetchClasses();
  }

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Carregando...</main>;
  }

  const firstName = me?.user?.name?.split(" ")[0] || "Olá";

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
          <p className="text-gray-600">Gerencie suas turmas abaixo.</p>
        </div>

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
    </main>
  );
}
