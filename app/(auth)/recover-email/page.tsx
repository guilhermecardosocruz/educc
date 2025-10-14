"use client";
import { useState } from "react";
import Link from "next/link";

export default function RecoverEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/recover-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      await res.json().catch(()=> ({}));
      setDone(true);
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
            Recuperar conta por e-mail
          </h2>
          <p className="mt-4 text-white/90">
            Enviaremos um link de recuperação ao seu e-mail.
          </p>
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
              Voltar ao login
            </Link>
          </div>

          <h1 className="text-2xl font-semibold mb-1">Recuperar por e-mail</h1>
          <p className="text-sm text-gray-500 mb-6">Informe o e-mail cadastrado</p>

          {done ? (
            <div className="space-y-3">
              <p className="text-green-700">
                Se o e-mail existir, enviamos um link de recuperação. Verifique sua caixa de entrada.
              </p>
              <Link href="/login" className="btn-primary inline-flex justify-center">Voltar ao login</Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">E-mail</label>
                <input
                    className="input"
                    type="email"
                    placeholder="exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
              </div>

              {err && <p className="text-sm text-red-600">{err}</p>}

              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
