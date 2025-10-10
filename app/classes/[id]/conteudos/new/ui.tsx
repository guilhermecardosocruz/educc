"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClient({ id }: { id: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      alert("Informe o nome da aula");
      return;
    }
    setSaving(true);
    try {
      // 1) Gera imagem via IA
      const gen = await fetch(`/api/images/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: title.trim() })
      });
      const genData = await gen.json().catch(() => ({}));
      if (!gen.ok || !genData?.url) throw new Error(genData?.error || "Falha ao gerar imagem");

      // 2) Cria o conteúdo
      const res = await fetch(`/api/classes/${id}/conteudos`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim().length ? description.trim() : undefined,
          imageUrl: genData.url
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Erro ao criar conteúdo");

      router.replace(`/classes/${id}/conteudos`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("conteudo:created"));
      }
    } catch (e: any) {
      alert(e?.message || "Erro ao publicar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/classes/${id}/conteudos`} className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600">
          Voltar
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-900">Novo conteúdo (imagem por IA)</h1>
        <p className="text-sm text-gray-600 mb-4">Somente imagens geradas automaticamente com base no nome da aula.</p>

        <div className="grid gap-3">
          <input
            className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A66FF]"
            placeholder="Nome da aula (obrigatório)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0A66FF]"
            placeholder="Descrição / objetivo (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Publicando..." : "Publicar com IA"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
