"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Content = {
  seq: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt?: string;
};

export default function ConteudosClient({ classId }: { classId: string }) {
  return (
    <>
      <Creator classId={classId} />
      <Feed classId={classId} />
    </>
  );
}

function Creator({ classId }: { classId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const unsplashUrl = useMemo(() => {
    const q = encodeURIComponent(title || "aula");
    return `https://source.unsplash.com/1200x800/?${q}`;
  }, [title]);

  async function handlePickUnsplash() {
    setImageUrl(`${unsplashUrl}&t=${Date.now()}`);
  }

  async function handleGenerateAI() {
    try {
      const prompt = title?.trim() || "capa de aula";
      const res = await fetch(`/api/images/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        alert(data?.error || "Configure OPENAI_API_KEY para gerar imagem de IA.");
        return;
      }
      setImageUrl(data.url);
    } catch {
      alert("Falha ao gerar imagem.");
    }
  }

  async function handleUploadLocal() {
    if (!uploadFile) return;
    try {
      const toDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      const url = await toDataUrl(uploadFile);
      setImageUrl(url);
    } catch {
      alert("Falha ao carregar a imagem local.");
    }
  }

  async function handleCreate() {
    if (!title.trim()) {
      alert("Informe o nome da aula");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/classes/${classId}/conteudos`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim().length ? description.trim() : undefined,
          imageUrl: imageUrl || undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Erro ao criar conteúdo");

      setTitle(""); setDescription(""); setImageUrl(null); setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
      window.dispatchEvent(new CustomEvent("conteudo:created"));
    } catch (e: any) {
      alert(e?.message || "Erro ao criar conteúdo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Nova aula</h2>
        <p className="text-sm text-gray-600 mb-4">Dê um nome, um objetivo e escolha uma imagem (buscar na internet ou gerar por IA).</p>

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

          <div className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                id="img-file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="img-file"
                className="cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600"
              >
                Escolher do computador
              </label>
              <button
                type="button"
                onClick={handleUploadLocal}
                disabled={!uploadFile}
                className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                Usar imagem escolhida
              </button>

              <button
                type="button"
                onClick={handlePickUnsplash}
                className="rounded-xl border px-3 py-2 text-sm font-medium hover:border-blue-500 hover:text-blue-600"
              >
                Buscar na internet
              </button>
              <button
                type="button"
                onClick={handleGenerateAI}
                className="rounded-xl bg-[#0A66FF] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Gerar com IA
              </button>
            </div>

            {imageUrl && (
              <div className="mt-3 overflow-hidden rounded-xl border">
                <img src={imageUrl} alt="Pré-visualização" className="w-full object-cover max-h-[360px]" />
              </div>
            )}
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !title.trim()}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Publicando..." : "Publicar"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feed({ classId }: { classId: string }) {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/classes/${classId}/conteudos`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(data)) throw new Error("Falha ao carregar conteúdos");
      setItems(data);
    } catch (e: any) {
      alert(e?.message || "Erro ao carregar conteúdos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onCreated = () => load();
    window.addEventListener("conteudo:created", onCreated);
    return () => window.removeEventListener("conteudo:created", onCreated);
  }, []);

  if (loading) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm text-sm text-gray-600">Carregando…</div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="mt-6">
        <div className="rounded-2xl border bg-white p-8 shadow-sm text-center text-gray-700">
          Nenhum conteúdo ainda. Publique o primeiro acima.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 grid gap-6">
      {items.map((c) => (
        <article key={c.seq} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={c.title} className="w-full max-h-[420px] object-cover" />
          ) : (
            <div className="flex h-48 w-full items-center justify-center bg-blue-50 text-blue-700">Sem imagem</div>
          )}
          <div className="p-4">
            <h3 className="text-base font-semibold text-gray-900">
              {c.seq} — {c.title}
            </h3>
            {c.description && (
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{c.description}</p>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
