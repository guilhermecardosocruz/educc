"use client";
import { useEffect, useMemo, useState } from "react";

type ContentLite = { seq: number; title: string };
type ContentFull = {
  id: string;
  seq: number;
  title: string;
  objetivos?: string;
  desenvolvimento?: string;
  recursos?: string;
  bncc?: string;
};

function toTextFromSections(c?: Partial<ContentFull>) {
  if (!c) return "";
  const b: string[] = [];
  if (c.objetivos) b.push(`Objetivos: ${c.objetivos}`);
  if (c.desenvolvimento) b.push(`Desenvolvimento: ${c.desenvolvimento}`);
  if (c.recursos) b.push(`Recursos: ${c.recursos}`);
  if (c.bncc) b.push(`BNCC: ${c.bncc}`);
  return b.join("\n");
}

export default function AiHelpClient({ classId }: { classId: string }) {
  const [list, setList] = useState<ContentLite[]>([]);
  const [selectedSeq, setSelectedSeq] = useState<string>("");
  const [selectedContent, setSelectedContent] = useState<ContentFull | null>(null);
  const [problem, setProblem] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // carrega lista (seq + title)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/classes/${classId}/conteudos`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.ok && Array.isArray(data.list)) {
          setList(data.list as ContentLite[]);
        }
      } catch (e) {
        console.error("Falha ao carregar conteúdos", e);
      }
    })();
  }, [classId]);

  // quando usuário escolhe um conteúdo, carrega as seções completas
  useEffect(() => {
    (async () => {
      setSelectedContent(null);
      if (!selectedSeq) return;
      try {
        const res = await fetch(`/api/classes/${classId}/conteudos/${selectedSeq}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.ok && data.content) {
          setSelectedContent(data.content as ContentFull);
        }
      } catch (e) {}
    })();
  }, [classId, selectedSeq]);

  const contextSummary = useMemo(() => {
    if (!selectedContent) return "";
    const header = `Aula ${selectedContent.seq} — ${selectedContent.title}`;
    const body = toTextFromSections(selectedContent);
    return body ? `${header}\n${body}` : header;
  }, [selectedContent]);

  function mockThreeSuggestions(topic: string, issue: string) {
    const base = topic || "aula";
    const p = issue || "imprevisto";
    return [
      `Plano B (rápido): transforme ${base} em uma dinâmica offline. Peça para os alunos, em duplas, criarem um mini-resumo ou mapa mental do tema. Materiais simples (papel/canetinhas). Tempo ~20-25min.`,
      `Atividade guiada: faça uma demonstração verbal/visual do principal conceito de ${base}, seguida de um quiz oral (mãos levantadas). Foque em 5–7 perguntas-chave e dê exemplos do cotidiano. Tempo ~15-20min.`,
      `Projeto relâmpago: grupos de 3–4 alunos resolvem um desafio prático relacionado a ${base} sem internet/PC. Defina critério de sucesso claro (ex.: explicar, montar protótipo de papel, encenar). Apresentações curtas no final.`
    ].map(s => `${s}\n⚠️ Adaptado para: ${p}`);
  }

  async function onGenerate() {
    if (!selectedSeq) { alert("Selecione um conteúdo."); return; }
    if (!problem.trim()) { alert("Descreva o que aconteceu."); return; }
    setBusy(true);
    try {
      const topic = selectedContent?.title || `Conteúdo ${selectedSeq}`;
      const opts = mockThreeSuggestions(topic, problem.trim());
      await new Promise(r => setTimeout(r, 350)); // simulação
      setOptions(opts);
    } finally {
      setBusy(false);
    }
  }

  function buildPrompt() {
    const header = `Quero 3 alternativas viáveis para conduzir a aula.`;
    const ctx = contextSummary ? `\n\nContexto da aula:\n${contextSummary}` : "";
    const prob = `\n\nO que aconteceu: ${problem.trim()}`;
    const reqs = `\n\nRequisitos:\n- Ser prático para turma de Ensino Fundamental II.\n- Não depender de internet.\n- Incluir tempo estimado e materiais simples.\n- Referenciar o conteúdo da aula quando aplicável.`;
    return header + ctx + prob + reqs;
  }

  function copyPrompt() {
    const text = buildPrompt();
    navigator.clipboard.writeText(text).then(() => {
      alert("Pedido copiado para a área de transferência.");
    });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-xl font-semibold mb-2">Ajuda com IA</h1>
      <p className="text-sm text-gray-600 mb-6">
        Selecione um conteúdo e descreva o que aconteceu. Vamos sugerir 3 alternativas rápidas (mock, sem custo).
      </p>

      <div className="rounded-2xl border bg-white p-5 shadow-soft">
        <div className="grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Conteúdo</span>
            <select
              value={selectedSeq}
              onChange={(e) => setSelectedSeq(e.target.value)}
              className="rounded-xl border px-3 py-2"
            >
              <option value="">Selecione…</option>
              {list.map(c => (
                <option key={c.seq} value={c.seq}>{c.seq} — {c.title}</option>
              ))}
            </select>
          </label>

          {selectedContent && (
            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
              <div className="font-semibold mb-1">Resumo do conteúdo</div>
              {contextSummary || "Sem detalhes cadastrados."}
            </div>
          )}

          <label className="grid gap-1">
            <span className="text-sm font-medium">O que aconteceu?</span>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
              className="rounded-xl border px-3 py-2"
              placeholder="Ex.: Estou sem internet / metade da turma sem notebook / laboratório fechado…"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onGenerate}
              disabled={busy}
              className="rounded-xl bg-[#0A66FF] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Gerando…" : "Gerar opções"}
            </button>

            <button
              onClick={copyPrompt}
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:border-blue-400 hover:text-blue-700"
            >
              Copiar pedido (prompt)
            </button>
          </div>

          {options.length > 0 && (
            <div className="mt-2">
              <h2 className="text-base font-semibold mb-2">3 opções sugeridas</h2>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
                {options.map((o, i) => (
                  <li key={i} className="whitespace-pre-wrap">{o}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
