"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginCard() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false); // 👈 controla visibilidade
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error ?? "Falha ao entrar");
      }
      router.push(next);
    } catch (e: any) {
      setErr(e?.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Entrar</h1>
      </div>

      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="exemplo@email.com"
        className="input w-full"
        required
      />

      {/* Campo de senha com 'olhinho' */}
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input w-full pr-10" /* espaço pro botão à direita */
          required
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          title={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
          tabIndex={0}
        >
          {/* Ícone olho/olho-riscado em SVG inline (sem libs) */}
          {show ? (
            /* olho aberto */
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5C6.5 5 2.3 8.7 1 12c1.3 3.3 5.5 7 11 7s9.7-3.7 11-7c-1.3-3.3-5.5-7-11-7Z" fill="currentColor" opacity=".15"/>
              <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-3C6.5 5 2.3 8.7 1 12c1.3 3.3 5.5 7 11 7s9.7-3.7 11-7c-1.3-3.3-5.5-7-11-7Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          ) : (
            /* olho fechado (riscado) */
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10.6 6.2A6.7 6.7 0 0 1 12 6c5.5 0 9.7 3.7 11 7-.5 1.2-1.3 2.4-2.4 3.5M6 7.6C3.9 8.9 2.4 10.4 1 13c.7 1.7 2.4 3.5 4.7 4.8 2.2 1.2 4.3 1.6 6.3 1.5 1.1-.1 2.2-.3 3.2-.7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="3.5" fill="currentColor" opacity=".15"/>
            </svg>
          )}
        </button>
      </div>

      {err && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {err}
        </div>
      )}

      <button disabled={loading} className="btn-primary w-full">
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
