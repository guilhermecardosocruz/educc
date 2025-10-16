"use client";
import { useEffect, useState } from "react";

type GroupRow = { id: string; name: string; linked: boolean };
type Props = {
  classId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function LinkToGroupModal({ classId, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch(`/api/classes/${classId}/groups`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao listar grupos");
      setGroups(data.groups || []);
    } catch (e: any) { setErr(e?.message || "Erro ao carregar"); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (open) load(); }, [open]);

  async function toggle(group: GroupRow) {
    setLoading(true); setErr(null);
    try {
      if (group.linked) {
        const res = await fetch(`/api/class-groups/${group.id}/classes?classId=${encodeURIComponent(classId)}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) throw new Error(data?.error || "Falha ao desvincular");
      } else {
        const res = await fetch(`/api/class-groups/${group.id}/classes`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ classId })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) throw new Error(data?.error || "Falha ao vincular");
      }
      await load();
    } catch (e: any) { setErr(e?.message || "Erro ao atualizar"); }
    finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Vincular a grupo</h2>
            <button className="p-1 rounded-md hover:bg-gray-100" onClick={() => onOpenChange(false)} aria-label="Fechar">✕</button>
          </div>

          <div className="border rounded-md max-h-72 overflow-auto divide-y">
            {loading ? (
              <div className="p-3 text-sm text-gray-500">Carregando…</div>
            ) : groups.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Você ainda não tem grupos.</div>
            ) : groups.map(g => (
              <div key={g.id} className="p-3 flex items-center justify-between gap-3">
                <div className="text-sm">{g.name}</div>
                <button
                  className={`px-3 py-1.5 rounded-lg text-sm ${g.linked ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100" : "border border-gray-300 hover:bg-gray-50"}`}
                  onClick={() => toggle(g)}
                  disabled={loading}
                >
                  {g.linked ? "Desvincular" : "Vincular"}
                </button>
              </div>
            ))}
          </div>

          {err && <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{err}</div>}

          <div className="mt-4 text-right">
            <button className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => onOpenChange(false)}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
