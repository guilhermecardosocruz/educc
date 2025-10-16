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

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      {badge && <div className="absolute top-3 left-4 z-10 pointer-events-none">{badge}</div>}

      <Link
        href={`/classes/${item.id}`}
        className="block w-full max-w-full overflow-hidden border rounded-xl p-4 pl-20 min-h-12 pr-10 hover:shadow-sm transition"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold truncate">{item.name}</h3>
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
          <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-md z-10" onClick={(e) => { e.stopPropagation(); }}>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setMenuOpen(false); setShareOpen(true); }}>
              Compartilhar
            </button>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setMenuOpen(false); setLinkOpen(true); }}>
              Vincular a grupo
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
