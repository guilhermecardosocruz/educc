"use client";

import { useMemo, useState } from "react";
import DateRangePicker from "./DateRangePicker";

type APIItem = {
  classId: string;
  className: string;
  contents: Array<{
    seq: number;
    title: string;
    objetivos?: string | null;
    desenvolvimento?: string | null;
    recursos?: string | null;
    bncc?: string | null;
    lessonDate?: string | null;
  }>;
};

export default function GroupAIReportPromptButton({ groupId }: { groupId: string }) {
  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const monthStart = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}-01`;
  }, []);

  const [range, setRange] = useState<{ from: string; to: string }>({ from: monthStart, to: today });
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState<string>("");

  async function handleBuildPrompt() {
    if (!range.from || !range.to) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ from: range.from, to: range.to }).toString();
      const res = await fetch(`/api/class-groups/${groupId}/contents?${qs}`, { method: "GET", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Falha ao carregar conteúdos");

      const items: APIItem[] = data.items ?? [];
      const groupName: string = data.group?.name ?? "Grupo";

      const lines: string[] = [];
      lines.push(`Você é um coordenador pedagógico. Gere um RELATÓRIO DE CHAMADAS E CONTEÚDOS para o grupo "${groupName}".`);
      lines.push(`Período analisado: ${range.from} a ${range.to}.`);
      lines.push("");
      lines.push("Estrutura desejada do relatório:");
      lines.push("1) Sumário executivo (1 parágrafo curto).");
      lines.push("2) Ações programadas (por turma):");
      lines.push("   - Liste os conteúdos planejados com base nos títulos e objetivos.");
      lines.push("3) Ações executadas (por turma):");
      lines.push("   - Para cada conteúdo, descreva: Título, Objetivo, Desenvolvimento das atividades (resumo), Recursos pedagógicos utilizados.");
      lines.push("4) Observações e recomendações (pontos de atenção, intervenções futuras).");
      lines.push("");
      lines.push("Dados brutos por turma (use-os como base, reescrevendo em tom claro e profissional):");

      for (const it of items) {
        lines.push("");
        lines.push(`Turma: ${it.className}`);
        if (!it.contents?.length) {
          lines.push("  (Sem conteúdos registrados no período.)");
          continue;
        }
        for (const c of it.contents) {
          const d = c.lessonDate ? new Date(c.lessonDate).toLocaleDateString("pt-BR") : "";
          lines.push(`- [${d || "s/ data"}] Seq ${c.seq} — Título: ${c.title || "(sem título)"}`);
          if (c.objetivos) lines.push(`  Objetivo: ${c.objetivos}`);
          if (c.desenvolvimento) lines.push(`  Desenvolvimento: ${c.desenvolvimento}`);
          if (c.recursos) lines.push(`  Recursos pedagógicos: ${c.recursos}`);
          if (c.bncc) lines.push(`  BNCC: ${c.bncc}`);
        }
      }

      lines.push("");
      lines.push("Formato de saída: Markdown com títulos claros (## Ações programadas, ## Ações executadas, etc.).");
      setPrompt(lines.join("\n"));
      (document.getElementById("aiPromptModal") as HTMLDialogElement | null)?.showModal();
    } catch (e: any) {
      alert(e?.message || "Erro ao montar prompt");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(prompt).then(
      () => alert("Prompt copiado!"),
      () => alert("Falha ao copiar para a área de transferência.")
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <DateRangePicker from={range.from} to={range.to} onChange={setRange} disabled={loading} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBuildPrompt}
          disabled={loading}
          className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Montando prompt..." : "Gerar prompt (GPT)"}
        </button>
        <span className="text-xs text-gray-600">Cria um texto-base para relatório pedagógico.</span>
      </div>

      {/* Modal nativo simples */}
      <dialog id="aiPromptModal" className="rounded-xl p-0 w-[min(900px,95vw)]">
        <form method="dialog" className="p-0">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-semibold">Prompt para Relatório (copie e cole no GPT)</h3>
            <button className="text-sm px-2 py-1 rounded-md border hover:bg-gray-50">Fechar</button>
          </div>
          <div className="p-4">
            <textarea
              readOnly
              value={prompt}
              className="w-full h-[50vh] rounded-md border p-3 text-sm font-mono"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Copiar
              </button>
              <a
                href="https://chat.openai.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                title="Abrir ChatGPT Web em nova aba"
              >
                Abrir ChatGPT Web
              </a>
            </div>
          </div>
        </form>
      </dialog>
    </div>
  );
}
