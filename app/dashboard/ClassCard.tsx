"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ShareClassModal from "@/components/ShareClassModal";

type Role = "PROFESSOR" | "GESTOR" | null;

export default function ClassCard({
  cls,
  onDeleted,
}: {
  cls: { id: string; name: string; role?: Role };
  onDeleted?: (id: string) => void;
}) {
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

  async function handleDelete() {
    if (!confirm(`Excluir a turma "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/classes/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      // remoção otimista: avisa o pai para tirar da lista
      if (onDeleted) {
        onDeleted(item.id);
      } else {
        // fallback caso o card seja usado isolado em outra tela
        router.refresh();
      }
    } catch (e: any) {
      alert(e?.message || "Falha ao excluir turma");
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  }

  const badge =
    item.role ? (
      <span
        className={`ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
          item.role === "PROFESSOR"
            ? "bg-blue-100 text-blue-700 border border-blue-200"
            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
        }`}
        title={`Seu papel nesta turma: ${item.role}`}
      >
        {item.role}
      </span>
    ) : null;

  return (
    <div className="relative">
      <Link href={`/classes/${item.id}`} className="block border rounded-xl p-4 pr-12 hover:shadow-sm transition">
        <h3 className="font-semibold truncate">
          {item.name}
          {badge}
        </h3>
        <p className="text-sm text-gray-500">Clique para abrir</p>
      </Link>

      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 border border-gray-200"
          aria-label="Mais ações"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
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
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir turma"}
            </button>
          </div>
        )}
      </div>

      {/* @ts-ignore */}
      <ShareClassModal classId={item.id} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}
