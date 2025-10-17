"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type EventItem = {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  local?: string;
  carga_horaria?: string;
  responsavel?: string;
  tags?: string;
  status?: string;
  observacoes?: string;
};
type Student = {
  aluno_nome: string;
  aluno_doc?: string;
  turma?: string;
  carga_horaria?: string;
  observacoes?: string;
};

function useEventIdFromPath(): string {
  // /gestao/certificados/[id]
  const parts = typeof window !== "undefined" ? window.location.pathname.split("/") : [];
  return parts[parts.length - 1] || "";
}

const evKey = (id: string) => `cert:event:${id}`;
const stKey = (id: string) => `cert:event:students:${id}`;

export default function CertEventPage() {
  const id = useEventIdFromPath();

  const [ev, setEv] = useState<EventItem>(() => ({
    id, nome: "",
    descricao: "", data_inicio: "", data_fim: "",
    local: "", carga_horaria: "", responsavel: "",
    tags: "", status: "", observacoes: ""
  }));
  const [students, setStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // carrega do localStorage
  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(evKey(id));
      if (raw) setEv(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(stKey(id));
      if (raw) setStudents(JSON.parse(raw));
    } catch {}
  }, [id]);

  function persist(next: EventItem) {
    setEv(next);
    try { localStorage.setItem(evKey(id), JSON.stringify(next)); } catch {}
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!ev.nome?.trim()) {
      alert("Nome do evento é obrigatório");
      return;
    }
    setSaving(true);
    // sem backend por enquanto — apenas persiste localmente
    persist({ ...ev, id });
    setSaving(false);
    alert("Evento salvo localmente.");
  }

  async function downloadTemplate() {
    const res = await fetch(`/api/cert-events/${id}/template`, { cache: "no-store" });
    if (!res.ok) { alert("Falha ao baixar modelo"); return; }
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cert-event-${id}-alunos.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function onUploadPlanilha(file: File) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/cert-events/${id}/students`, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        alert(data?.error || "Falha ao processar planilha");
        return;
      }
      const alunos: Student[] = data.alunos || [];
      setStudents(alunos);
      try { localStorage.setItem(stKey(id), JSON.stringify(alunos)); } catch {}
    } finally {
      setUploading(false);
      (document.getElementById("upload-xlsx") as HTMLInputElement | null)?.value && ((document.getElementById("upload-xlsx") as HTMLInputElement).value = "");
    }
  }

  async function gerarPDF() {
    if (!ev.nome?.trim()) {
      alert("Preencha o nome do evento antes de gerar.");
      return;
    }
    if (!students.length) {
      alert("Nenhum aluno carregado. Envie a planilha primeiro.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`/api/cert-events/${id}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: ev, students })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Falha ao gerar PDF");
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `certificados-${id}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen p-6 lg:p-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Evento: {ev?.nome || "Novo"}</h1>
        <Link href="/gestao/certificados" className="btn-primary">Voltar</Link>
      </header>

      {/* FORM DO EVENTO */}
      <section className="card p-6 mb-6">
        <form onSubmit={onSave} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do evento *</label>
            <input className="input" value={ev.nome} onChange={e => persist({ ...ev, nome: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea className="input" rows={4} value={ev.descricao || ""} onChange={e => persist({ ...ev, descricao: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data início</label>
              <input className="input" type="date" value={ev.data_inicio || ""} onChange={e => persist({ ...ev, data_inicio: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data fim</label>
              <input className="input" type="date" value={ev.data_fim || ""} onChange={e => persist({ ...ev, data_fim: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Local</label>
              <input className="input" value={ev.local || ""} onChange={e => persist({ ...ev, local: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carga horária</label>
              <input className="input" placeholder="Ex.: 8h" value={ev.carga_horaria || ""} onChange={e => persist({ ...ev, carga_horaria: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Responsável</label>
              <input className="input" value={ev.responsavel || ""} onChange={e => persist({ ...ev, responsavel: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <input className="input" placeholder="formação, oficina" value={ev.tags || ""} onChange={e => persist({ ...ev, tags: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <input className="input" placeholder="rascunho, ativo" value={ev.status || ""} onChange={e => persist({ ...ev, status: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea className="input" rows={3} value={ev.observacoes || ""} onChange={e => persist({ ...ev, observacoes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-2">
            <Link href="/gestao/certificados" className="btn-secondary">Voltar</Link>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </form>
      </section>

      {/* SEÇÃO: PLANILHA + CERTIFICADOS */}
      <section className="card p-6">
        <h3 className="font-semibold mb-4">Alunos & Certificados</h3>

        <div className="flex flex-wrap gap-3 mb-4">
          <button type="button" className="btn-primary" onClick={downloadTemplate}>
            Baixar modelo de planilha (.xlsx)
          </button>

          <label className="btn-secondary cursor-pointer">
            <input id="upload-xlsx" type="file" accept=".xlsx,.xls" className="hidden"
                   onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadPlanilha(f); }} />
            {uploading ? "Enviando..." : "Enviar planilha preenchida"}
          </label>

          <button type="button" className="btn-primary" onClick={gerarPDF} disabled={generating || !students.length}>
            {generating ? "Gerando..." : "Gerar certificados (PDF único)"}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          {students.length
            ? <>Alunos carregados: <strong>{students.length}</strong></>
            : "Nenhum aluno carregado ainda. Baixe o modelo, preencha e envie a planilha."}
        </p>

        {!!students.length && (
          <div className="max-h-64 overflow-auto border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left">Doc.</th>
                  <th className="p-2 text-left">Turma</th>
                  <th className="p-2 text-left">CH</th>
                  <th className="p-2 text-left">Obs.</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{s.aluno_nome}</td>
                    <td className="p-2">{s.aluno_doc || "-"}</td>
                    <td className="p-2">{s.turma || "-"}</td>
                    <td className="p-2">{s.carga_horaria || "-"}</td>
                    <td className="p-2">{s.observacoes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
