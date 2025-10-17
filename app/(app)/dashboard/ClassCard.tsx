"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ShareClassModal from "@/components/ShareClassModal";
import LinkToGroupModal from "@/components/LinkToGroupModal";

type Role = "PROFESSOR" | "GESTOR" | null;
type ClassLite = { id: string; name: string; roleForMe?: Role };

export default function ClassCard({ cls, filterGroupId }: { cls: ClassLite, filterGroupId?: string | null }) {
  const item = cls;
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const badge =
    item.roleForMe ? (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          item.roleForMe === "PROFESSOR"
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}
      >
        {item.roleForMe === "PROFESSOR" ? "Professor" : "Gestor"}
      </span>
    ) : null;

  async function onDelete() {
    if (!confirm("Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/classes/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      alert(data?.error || "Erro ao excluir turma");
      return;
    }
    window.location.reload();
  }

  async function onRename() {
    const current = item.name || "";
    const next = prompt("Novo nome da turma:", current)?.trim();
    if (!next || next === current) return;
    const res = await fetch(`/api/classes/${item.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: next })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      alert(data?.error || "Erro ao renomear turma");
      return;
    }
    window.location.reload();
  }

  return (
    <div className="relative w-full max-w-full">
      <Link
        href={`/classes/${item.id}`}
        className="block w-full max-w-full overflow-hidden border rounded-xl p-4 pr-12 hover:shadow-sm transition"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {badge && <div className="mb-1">{badge}</div>}
            <h3 className="font-semibold leading-tight truncate">{item.name}</h3>
          </div>
        </div>
      </Link>

      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 border border-gray-200"
          aria-label="Mais ações"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-md border bg-white shadow-md z-20" onClick={(e) => { e.stopPropagation(); }}>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setMenuOpen(false); setShareOpen(true); }}>
              Compartilhar
            </button>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setMenuOpen(false); setLinkOpen(true); }}>
              Vincular a grupo
            </button>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setMenuOpen(false); onRename(); }}>
              Renomear
            </button>
            <div className="my-1 border-t" />
            <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={() => { setMenuOpen(false); onDelete(); }}>
              Excluir
            </button>
          </div>
        )}
      </div>

      <ShareClassModal classId={item.id} open={shareOpen} onOpenChange={setShareOpen} />
      <LinkToGroupModal classId={item.id} open={linkOpen} onOpenChange={setLinkOpen} />
    </div>
  );
}
