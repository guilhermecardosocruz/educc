"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ShareClassModal from "@/components/ShareClassModal";

export default function ClassCard({ cls }: { cls: { id: string; name: string } }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // fechar menu ao clicar fora
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  return (
    <div className="relative">
      {/* Card inteiro clicável */}
      <Link
        href={`/classes/${cls.id}`}
        className="block border rounded-xl p-4 pr-12 hover:shadow-sm transition"
      >
        <h3 className="font-semibold truncate">{cls.name}</h3>
        <p className="text-sm text-gray-500">Clique para abrir</p>
      </Link>

      {/* Botão 3 pontinhos (kebab) no canto direito */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          type="button"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 border border-gray-200"
          aria-label="Mais ações"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
        >
          {/* ⋮ ícone vertical */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md z-10"
            onClick={(e) => { e.stopPropagation(); }}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              onClick={() => { setMenuOpen(false); setShareOpen(true); }}
            >
              Compartilhar
            </button>
          </div>
        )}
      </div>

      {/* Modal controlado externamente */}
      <ShareClassModal classId={cls.id} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}
