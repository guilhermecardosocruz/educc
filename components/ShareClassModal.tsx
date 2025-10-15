"use client";
import { useState, useEffect } from "react";

type LinkRow = {
  id: string;
  token: string;
  role: "PROFESSOR" | "GESTOR";
  createdAt: string;
  createdBy: string;
};

export default function ShareClassModal({ classId }: { classId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // convite por e-mail
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"PROFESSOR" | "GESTOR">("GESTOR");

  async function loadLinks() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/classes/${classId}/access/links`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Falha ao listar links");
      setLinks(data.links || []);
    } catch (e: any) {
      setErr(e.message || "Erro ao carregar links");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadLinks();
  }, [open]);

  async function createLink(role: "PROFESSOR" | "GESTOR") {
    setLoading(true);
    setMsg(null); setErr(null);
    try {
      const res = await fetch(`/api/classes/${classId}/access/links`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Falha ao criar link");
      setMsg(role === "PROFESSOR" ? "Link de professor criado!" : "Link de gestor criado!");
      await loadLinks();
    } catch (e: any) {
      setErr(e.message || "Erro ao criar link");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/share/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copiado!");
    } catch {
      setErr("Não consegui copiar — copie manualmente:");
    }
  }

  async function inviteByEmail() {
    setLoading(true);
    setMsg(null); setErr(null);
    try {
      const res = await fetch(`/api/classes/${classId}/access/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole })
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Falha ao convidar");
      setMsg(`Acesso concedido a ${email} como ${inviteRole}.`);
      setEmail("");
    } catch (e: any) {
      setErr(e.message || "Erro ao convidar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botão compacto com ícone (sem texto) */}
      <button
        type="button"
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        onClick={() => setOpen(true)}
        aria-label="Compartilhar turma"
        title="Compartilhar"
      >
        {/* ícone share (inline SVG, 20x20) */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M16 6a3 3 0 1 0-2.83-4H13a3 3 0 0 0 3 4Z" fill="currentColor" opacity=".15"/>
          <path d="M18 8a3 3 0 1 0-2.83-4M6 14a3 3 0 1 0 2.83 4M6 14l9-5M8.83 18l7.34 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Compartilhar turma</h2>
                <button className="p-1 rounded-md hover:bg-gray-100" onClick={() => setOpen(false)} aria-label="Fechar">✕</button>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                Convide alguém como <strong>Professor</strong> (único) ou <strong>Gestor</strong> (vários).
              </p>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-2">Convidar por e-mail (usuário já cadastrado)</div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@exemplo.com"
                      className="w-full rounded-md border px-3 py-1.5 text-sm"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="rounded-md border px-2 py-1.5 text-sm"
                    >
                      <option value="GESTOR">Gestor</option>
                      <option value="PROFESSOR">Professor</option>
                    </select>
                    <button
                      disabled={loading || !email}
                      onClick={inviteByEmail}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                    >
                      Convidar
                    </button>
                  </div>
                </div>

                <div className="border rounded-md">
                  <div className="p-3 border-b text-sm font-medium">Links ativos</div>
                  <div className="max-h-64 overflow-auto divide-y">
                    {loading ? (
                      <div className="p-3 text-sm text-gray-500">Carregando…</div>
                    ) : links.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">Nenhum link criado ainda.</div>
                    ) : (
                      links.map((l) => {
                        const url = typeof window !== "undefined"
                          ? `${window.location.origin}/share/${l.token}`
                          : `/share/${l.token}`;
                        return (
                          <div key={l.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{l.role}</div>
                              <div className="text-xs text-gray-500 truncate">{url}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                className="px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 text-sm"
                                onClick={() => copyLink(l.token)}
                              >
                                Copiar
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {msg && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">{msg}</div>}
                {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{err}</div>}
              </div>

              <div className="mt-4 text-right">
                <button className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
