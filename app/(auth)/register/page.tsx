"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    cpf: "",
    birthDate: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    if (form.password.length < 8) {
      setErr("A senha deve ter pelo menos 8 caracteres");
      setLoading(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErr("As senhas não conferem");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) {
        setErr(data?.error ?? "Erro ao criar conta");
      } else {
        // após registrar, levar ao login
        router.push("/login");
      }
    } catch {
      setErr("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex items-center justify-center bg-[var(--color-brand-blue)] text-white">
        <div className="max-w-xl px-8">
          <h2 className="text-4xl font-extrabold leading-tight">
            Crie sua conta EDUCC
          </h2>
          <p className="mt-4 text-white/90">
            Acesso rápido e seguro.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="card p-8 max-w-lg w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="inline-block h-4 w-4 rounded-full bg-[var(--color-brand-blue)]" />
              <span className="font-semibold">EDUCC</span>
            </div>
            <Link href="/login" className="text-sm text-[var(--color-brand-blue)] hover:underline">
              Já tenho conta
            </Link>
          </div>

          <h1 className="text-2xl font-semibold mb-1">Criar conta</h1>
          <p className="text-sm text-gray-500 mb-6">Preencha seus dados</p>

          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1">Nome completo</label>
              <input className="input" value={form.name} onChange={e=>update("name", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">CPF</label>
              <input className="input" value={form.cpf} onChange={e=>update("cpf", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Data de nascimento</label>
              <input className="input" type="date" value={form.birthDate} onChange={e=>update("birthDate", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input className="input" type="email" value={form.email} onChange={e=>update("email", e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Telefone (Whats)</label>
              <input className="input" type="tel" value={form.phone} onChange={e=>update("phone", e.target.value)} required />
            </div>

            <div>
              <label className="block text-sm mb-1">Senha</label>
              <input className="input" type="password" value={form.password} onChange={e=>update("password", e.target.value)} required minLength={8} />
            </div>
            <div>
              <label className="block text-sm mb-1">Confirmar senha</label>
              <input className="input" type="password" value={form.confirmPassword} onChange={e=>update("confirmPassword", e.target.value)} required minLength={8} />
            </div>

            {err && <p className="sm:col-span-2 text-sm text-red-600">{err}</p>}

            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Criando..." : "Criar conta"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
