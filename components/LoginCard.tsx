"use client";
import { useState } from "react";

export default function LoginCard() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: chamar sua rota /api/auth/login
    alert(`Login com: ${email}`);
  };

  return (
    <div className="card w-full max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-1">Entrar</h1>
      <p className="text-sm text-gray-600 mb-6">
        Acesse sua conta para continuar.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input
            type="email"
            className="input"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className="btn-primary w-full">Entrar</button>

        <div className="flex justify-between text-sm text-gray-600">
          <a href="/(auth)/recover" className="underline">Esqueci a senha</a>
          <a href="/register" className="underline">Criar conta</a>
        </div>
      </form>
    </div>
  );
}
