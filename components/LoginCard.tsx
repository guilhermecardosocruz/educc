"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) {
        setErr(data?.error ?? "Credenciais inválidas");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setErr("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-block h-4 w-4 rounded-full bg-[var(--color-brand-blue)]" />
          <span className="font-semibold">EDUCC</span>
        </div>
        <Link href="/recover-email" className="text-sm text-[var(--color-brand-blue)] hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-1">Entrar</h1>
      <p className="text-sm text-gray-500 mb-6">Acesse sua conta</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            className="input"
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Senha</label>
          <div className="relative">
            <input
              className="input pr-12"
              type={show ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              title={show ? "Ocultar senha" : "Mostrar senha"}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {show ? (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5C6.5 5 2.3 8.7 1 12c1.3 3.3 5.5 7 11 7s9.7-3.7 11-7c-1.3-3.3-5.5-7-11-7Z" fill="currentColor" opacity=".15"/>
                  <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-3C6.5 5 2.3 8.7 1 12c1.3 3.3 5.5 7 11 7s9.7-3.7 11-7c-1.3-3.3-5.5-7-11-7Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M10.6 6.2A6.7 6.7 0 0 1 12 6c5.5 0 9.7 3.7 11 7-.5 1.2-1.3 2.4-2.4 3.5M6 7.6C3.9 8.9 2.4 10.4 1 13c.7 1.7 2.4 3.5 4.7 4.8 2.2 1.2 4.3 1.6 6.3 1.5 1.1-.1 2.2-.3 3.2-.7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="3.5" fill="currentColor" opacity=".15"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-6">
        Não tem conta?{" "}
        <Link href="/register" className="text-[var(--color-brand-blue)] hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
