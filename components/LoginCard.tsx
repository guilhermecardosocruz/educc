"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginCard() {
  const router = useRouter();
  const [emailOrCpf, setEmailOrCpf] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify({ emailOrCpf, password })
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
          <label className="block text-sm mb-1">E-mail ou CPF</label>
          <input
            className="input"
            type="text"
            placeholder="voce@exemplo.com ou 000.000.000-00"
            value={emailOrCpf}
            onChange={(e) => setEmailOrCpf(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input
            className="input"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
          />
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
