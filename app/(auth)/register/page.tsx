"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskPhone(v: string) {
  const s = v.replace(/\D/g, "").slice(0, 11);
  if (s.length <= 10) return s.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return s.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, cpf, birthDate, email, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setErr(data?.error?.message ?? "Erro ao criar conta");
        setLoading(false);
        return;
      }
      router.push("/login");
    } catch {
      setErr("Falha de rede. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex items-center justify-center bg-[var(--color-brand-blue)] text-white">
        <div className="max-w-xl px-8">
          <h2 className="text-4xl font-extrabold leading-tight">Crie sua conta EDUCC</h2>
          <p className="mt-4 text-white/90">Cadastre-se e acesse a plataforma instalável (PWA).</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 lg:p-12">
        <div className="card p-8 max-w-md w-full">
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
          <p className="text-sm text-gray-500 mb-6">Preencha seus dados abaixo</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Nome completo</label>
              <input className="input" type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            </div>
            <div>
              <label className="block text-sm mb-1">CPF</label>
              <input className="input" type="text" inputMode="numeric" placeholder="000.000.000-00"
                     value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} required />
            </div>
            <div>
              <label className="block text-sm mb-1">Data de nascimento</label>
              <input className="input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm mb-1">Telefone (WhatsApp)</label>
              <input className="input" type="tel" inputMode="tel" placeholder="(00) 00000-0000"
                     value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} required />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar conta"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
