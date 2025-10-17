"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  onLogout?: () => Promise<void> | void;
};

export default function UserMenuButton({ onLogout }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function handleLogout() {
    if (onLogout) {
      await onLogout();
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Abrir menu"
        className="h-10 px-3 inline-flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md z-20">
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            onClick={() => { setOpen(false); router.push("/gestao"); }}
          >
            Gestão
          </button>
          <div className="my-1 border-t" />
          <button
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
