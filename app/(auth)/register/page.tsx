"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Helpers de máscara
function onlyDigits(s: string) { return s.replace(/\D+/g, ""); }

function maskCPF(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  const p1 = d.slice(0,3);
  const p2 = d.slice(3,6);
  const p3 = d.slice(6,9);
  const p4 = d.slice(9,11);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  if (p4) out += "-" + p4;
  return out;
}

function maskPhoneBR(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  const ddd = d.slice(0,2);
  const a = d.length > 10 ? d.slice(2,7) : d.slice(2,6);
  const b = d.length > 10 ? d.slice(7,11) : d.slice(6,10);
  let out = ddd ? `(${ddd}` : "";
  if (ddd && d.length >= 2) out += ") ";
  if (a) out += a;
  if (b) out += "-" + b;
  return out;
}

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

    // normalizações
    const email = form.email.trim().toLowerCase();
    const cpf = form.cpf.trim();
    const phone = form.phone.trim();
    const name = form.name.trim();

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
    // Validações básicas de client
    if (onlyDigits(cpf).length !== 11) {
      setErr("CPF inválido");
      setLoading(false);
      return;
    }
    const phoneDigits = onlyDigits(phone);
    if (!(phoneDigits.length === 10 || phoneDigits.length === 11)) {
      setErr("Telefone inválido");
      setLoading(false);
      return;
    }
    if (!form.birthDate) {
      setErr("Informe a data de nascimento");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          name,
          cpf,        // API já remove dígitos; máscara ok
          phone,      // idem
          email       // normalizado
        })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) {
        setErr(data?.error ?? "Erro ao criar conta");
      } else {
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
              <input
                className="input"
                value={form.name}
                onChange={e=>update("name", e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">CPF</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(e)=> update("cpf", maskCPF(e.target.value))}
                maxLength={14}                             
                required
                pattern="^\d{3}\.\d{3}\.\d{3}-\d{2}$"
                title="Formato: 000.000.000-00"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Data de nascimento</label>
              <input
                className="input"
                type="date"
                value={form.birthDate}
                onChange={e=>update("birthDate", e.target.value)}
                required
                autoComplete="bday"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="voce@exemplo.com"
                value={form.email}
                onChange={(e)=> update("email", e.target.value.trim())}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Telefone (Whats)</label>
              <input
                className="input"
                type="tel"
                inputMode="tel"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={(e)=> update("phone", maskPhoneBR(e.target.value))}
                maxLength={15}
                required
                pattern="^\(\d{2}\)\s?\d{4,5}-\d{4}$"
                title="Formato: (00) 00000-0000"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Senha</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={e=>update("password", e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Confirmar senha</label>
              <input
                className="input"
                type="password"
                value={form.confirmPassword}
                onChange={e=>update("confirmPassword", e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
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
