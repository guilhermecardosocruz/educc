"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ShareClassModal from "@/components/ShareClassModal";

type Role = "PROFESSOR" | "GESTOR" | null;
type ClassLite = { id: string; name: string; roleForMe?: Role };

export default function ClassCard({ cls }: { cls: ClassLite }) {
  const item = cls;
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  async function onDelete() {
    if (deleting) return;
    if (!confirm("Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/classes/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        alert(data?.error || "Falha ao excluir turma");
        return;
      }
      setMenuOpen(false);
      // Como a página é client, garantir atualização total:
      window.location.reload();
      // Alternativa em app router: router.refresh();
    } catch (e) {
      alert("Erro ao excluir turma");
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

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

  const canDelete = item.roleForMe === "PROFESSOR" || item.roleForMe === "GESTOR";

  return (
    <div className="relative">
      <Link href={`/classes/${item.id}`} className="block border rounded-xl p-4 pr-12 hover:shadow-sm transition">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold truncate">{item.name}</h3>
          {badge}
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
          <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md z-10" onClick={(e) => { e.stopPropagation(); }}>
            <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setMenuOpen(false); setShareOpen(true); }}>
              Compartilhar
            </button>
            {canDelete && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "Excluindo..." : "Excluir turma"}
              </button>
            )}
          </div>
        )}
      </div>

      <ShareClassModal classId={item.id} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}
