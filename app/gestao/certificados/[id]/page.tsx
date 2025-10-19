"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import EditCertStudentModal, { CertStudent as ModalStudent } from "@/components/EditCertStudentModal";

type EventItem = {
  id: string;
  // Identidade do curso
  nome: string;
  local?: string;
  cidade_uf?: string;            // ex.: "Criciúma (SC)"
  data_inicio?: string;          // YYYY-MM-DD
  data_fim?: string;             // YYYY-MM-DD
  carga_horaria?: string;        // ex.: "08h"
  // Textos do certificado (frente/verso) com códigos
  texto_participante?: string;   // usa [nome do participante], [cpf], [carga horária]
  texto_ministrante?: string;
  texto_organizador?: string;
  texto_verso?: string;
  // Logos/brasões
  logos?: { prefeitura?: boolean; escola?: boolean; brasao?: boolean };
  // Assinaturas (institucionais; participante é automático)
  sign1_name?: string; sign1_role?: string;
  sign2_name?: string; sign2_role?: string;
  // Validação & verso
  qr_url?: string;               // link que vira QR Code
  autorizacao_texto?: string;    // "Curso autorizado de acordo com ..."
  // Extra
  responsavel?: string;          // usado também no verso
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
  const parts = typeof window !== "undefined" ? window.location.pathname.split("/") : [];
  return parts[parts.length - 1] || "";
}

const evKey = (id: string) => `cert:event:${id}`;
const stKey = (id: string) => `cert:event:students:${id}`;

export default function CertEventPage() {
  const id = useEventIdFromPath();

  const [ev, setEv] = useState<EventItem>(() => ({
    id, nome: "",
    logos: { prefeitura: true, escola: true, brasao: true },
  }));
  const [students, setStudents] = useState<Student[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // --- estados do modal de edição ---
  const [editOpen, setEditOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // ===== Persistência =====
  function persist(next: EventItem) {
    setEv(next);
    try { localStorage.setItem(evKey(id), JSON.stringify(next)); } catch {}
  }
  function persistStudents(list: Student[]) {
    setStudents(list);
    try { localStorage.setItem(stKey(id), JSON.stringify(list)); } catch {}
  }

  // ===== Exemplos (evento + alunos) =====
  function exemploEvento(): EventItem {
    return {
      id,
      nome: "WORKSHOP ETP: DA IDENTIFICAÇÃO DA DEMANDA À CONTRATAÇÃO",
      local: "Escola Municipal de Governo de Criciúma",
      cidade_uf: "Criciúma (SC)",
      data_inicio: "2025-08-19",
      data_fim: "2025-08-19",
      carga_horaria: "08h",
      texto_participante:
        'Certificamos que [nome do participante] participou do Curso "WORKSHOP ETP: DA IDENTIFICAÇÃO DA DEMANDA À CONTRATAÇÃO", promovido e organizado pela Escola Municipal de Governo de Criciúma, realizado no período de 19/08/2025, com carga horária de [carga horária].',
      texto_ministrante: "Ministrante: Equipe Técnica da Secretaria Municipal de Educação.",
      texto_organizador: "Organizador: Escola Municipal de Governo de Criciúma.",
      texto_verso:
        "Conteúdos: Introdução ao ETP; Levantamento de Demandas; Critérios de Contratação; Estudos de Caso. Metodologia: Aula expositiva, atividades práticas e discussão orientada.",
      logos: { prefeitura: true, escola: true, brasao: true },
      sign1_name: "VÁGNER ESPÍNDOLA RODRIGUES",
      sign1_role: "Prefeito Municipal",
      sign2_name: "GEÓVANA BENEDET ZANETTE",
      sign2_role: "Secretária Municipal de Educação",
      // NOVOS CAMPOS (verso)
      qr_url: "https://seu.dominio.gov.br/validacao/cert/ABC123",
      autorizacao_texto: "Curso autorizado de acordo com o Artigo 23 da Lei nº 4.307, de 02 de maio de 2002.",
      responsavel: "Gislene dos Santos Sala",
      observacoes: "Certificado válido mediante verificação de presença.",
    };
  }
  function exemploAlunos(): Student[] {
    return [
      { aluno_nome: "NATALIA BENITES", aluno_doc: "034.***.***-36", turma: "Turma A", carga_horaria: "08h" },
      { aluno_nome: "JOÃO SILVA", aluno_doc: "123.456.789-00", turma: "Turma B", carga_horaria: "08h" },
      { aluno_nome: "MARIA OLIVEIRA", aluno_doc: "987.654.321-00", turma: "Turma A", carga_horaria: "08h" },
    ];
  }

  // ===== Carrega/localStorage + PRÉ-PREENCHIMENTO (se vazio ou ?demo=1) =====
  useEffect(() => {
    if (!id) return;

    let hadData = false;

    try {
      const rawEv = localStorage.getItem(evKey(id));
      if (rawEv) {
        const parsed = JSON.parse(rawEv);
        setEv(parsed);
        hadData = !!parsed?.nome;
      }
    } catch {}

    try {
      const rawSt = localStorage.getItem(stKey(id));
      if (rawSt) setStudents(JSON.parse(rawSt));
    } catch {}

    const forceDemo =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("demo") === "1";

    if (forceDemo || !hadData) {
      const evDemo = exemploEvento();
      const stDemo = exemploAlunos();
      persist(evDemo);
      persistStudents(stDemo);
    }
  }, [id]);

  // ===== Ações =====
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!ev.nome?.trim()) {
      alert("Nome do evento é obrigatório");
      return;
    }
    setSaving(true);
    persist({ ...ev, id });
    setSaving(false);
    alert("Evento salvo.");
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
      persistStudents(alunos);
    } finally {
      setUploading(false);
      const el = document.getElementById("upload-xlsx") as HTMLInputElement | null;
      if (el) el.value = "";
    }
  }

  async function gerarPDF() {
    if (!ev.nome?.trim()) { alert("Preencha o nome do evento antes de gerar."); return; }
    if (!students.length) { alert("Nenhum aluno carregado. Envie a planilha ou use os exemplos pré-carregados."); return; }
    setGenerating(true);
    try {
      const res = await fetch(`/api/cert-events/${id}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: ev, students }),
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

  // ===== Edição (duplo-clique + modal) =====
  function openEdit(i: number) {
    setEditingIndex(i);
    setEditingStudent(students[i] ?? null);
    setEditOpen(true);
  }
  function closeEdit() {
    setEditOpen(false);
    setEditingIndex(-1);
    setEditingStudent(null);
  }

  function handleSaveStudent(updated: ModalStudent, i: number) {
    const next = [...students];
    next[i] = {
      aluno_nome: updated.aluno_nome.trim(),
      aluno_doc: updated.aluno_doc?.trim() || undefined,
      turma: updated.turma?.trim() || undefined,
      carga_horaria: updated.carga_horaria?.trim() || undefined,
      observacoes: updated.observacoes?.trim() || undefined,
    };
    persistStudents(next);
    closeEdit();
  }

  function handleDeleteStudent(i: number) {
    if (!confirm("Excluir este aluno?")) return;
    const next = students.filter((_, idx) => idx !== i);
    persistStudents(next);
    closeEdit();
  }

  async function handleGenerateOne(i: number) {
    const st = students[i];
    if (!st) return;
    if (!ev.nome?.trim()) { alert("Preencha o nome do evento antes de gerar."); return; }
    try {
      const res = await fetch(`/api/cert-events/${id}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: ev, students: [st] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || "Falha ao gerar PDF");
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `certificado-${id}-aluno-${i + 1}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);
    } finally {
      closeEdit();
    }
  }

  return (
    <main className="min-h-screen p-6 lg:p-10 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Evento: {ev?.nome || "Novo"}</h1>
        <Link href="/gestao/certificados" className="btn-primary">Voltar</Link>
      </header>

      {/* FORM DO EVENTO */}
      <section className="card p-6 mb-6">
        <form onSubmit={onSave} className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Nome do evento *</label>
              <input className="input" value={ev.nome} onChange={e => persist({ ...ev, nome: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Local</label>
              <input className="input" value={ev.local || ""} onChange={e => persist({ ...ev, local: e.target.value })} placeholder="Auditório, Escola..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cidade/UF</label>
              <input className="input" value={ev.cidade_uf || ""} onChange={e => persist({ ...ev, cidade_uf: e.target.value })} placeholder="Ex.: Criciúma (SC)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data início</label>
              <input className="input" type="date" value={ev.data_inicio || ""} onChange={e => persist({ ...ev, data_inicio: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data fim</label>
              <input className="input" type="date" value={ev.data_fim || ""} onChange={e => persist({ ...ev, data_fim: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carga horária</label>
              <input className="input" placeholder="Ex.: 08h" value={ev.carga_horaria || ""} onChange={e => persist({ ...ev, carga_horaria: e.target.value })} />
            </div>
          </div>

          {/* Textos da FRENTE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Texto do participante (frente)</label>
              <textarea className="input" rows={4} value={ev.texto_participante || ""} onChange={e => persist({ ...ev, texto_participante: e.target.value })} placeholder='Use códigos: [nome do participante], [cpf], [carga horária]' />
              <span className="text-xs text-gray-500">Use os códigos: <code>[nome do participante]</code>, <code>[cpf]</code>, <code>[carga horária]</code>.</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Texto do ministrante (frente)</label>
              <textarea className="input" rows={3} value={ev.texto_ministrante || ""} onChange={e => persist({ ...ev, texto_ministrante: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Texto do organizador (frente)</label>
              <textarea className="input" rows={3} value={ev.texto_organizador || ""} onChange={e => persist({ ...ev, texto_organizador: e.target.value })} />
            </div>
          </div>

          {/* Validação & Verso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Link de validação (gera QR Code no verso)</label>
              <input className="input" value={ev.qr_url || ""} onChange={e => persist({ ...ev, qr_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Texto de autorização (verso)</label>
              <textarea className="input" rows={2} value={ev.autorizacao_texto || ""} onChange={e => persist({ ...ev, autorizacao_texto: e.target.value })} placeholder='Ex.: Curso autorizado de acordo com o Artigo 23 da Lei nº 4.307, de 02 de maio de 2002.' />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Responsável (verso)</label>
              <input className="input" value={ev.responsavel || ""} onChange={e => persist({ ...ev, responsavel: e.target.value })} placeholder="Ex.: Gislene dos Santos Sala" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Texto do verso (complementar)</label>
              <textarea className="input" rows={4} value={ev.texto_verso || ""} onChange={e => persist({ ...ev, texto_verso: e.target.value })} />
            </div>
          </div>

          {/* Logos/brasões */}
          <div>
            <label className="block text-sm font-medium mb-1">Logos/Brasões</label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!ev.logos?.prefeitura} onChange={e => persist({ ...ev, logos: { ...(ev.logos||{}), prefeitura: e.target.checked } })} />
                Prefeitura
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!ev.logos?.escola} onChange={e => persist({ ...ev, logos: { ...(ev.logos||{}), escola: e.target.checked } })} />
                Escola
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!ev.logos?.brasao} onChange={e => persist({ ...ev, logos: { ...(ev.logos||{}), brasao: e.target.checked } })} />
                Brasão do Município
              </label>
            </div>
          </div>

          {/* Assinaturas */}
          <div>
            <label className="block text-sm font-medium mb-2">Assinaturas (nome e cargo)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium">Assinatura 1 — Nome</label>
                <input className="input" value={ev.sign1_name || ""} onChange={e => persist({ ...ev, sign1_name: e.target.value })} placeholder="Ex.: VÁGNER ESPÍNDOLA RODRIGUES" />
                <label className="block text-xs font-medium mt-2">Assinatura 1 — Cargo</label>
                <input className="input" value={ev.sign1_role || ""} onChange={e => persist({ ...ev, sign1_role: e.target.value })} placeholder="Ex.: Prefeito Municipal" />
              </div>
              <div>
                <label className="block text-xs font-medium">Assinatura 2 — Nome</label>
                <input className="input" value={ev.sign2_name || ""} onChange={e => persist({ ...ev, sign2_name: e.target.value })} placeholder="Ex.: GEÓVANA BENEDET ZANETTE" />
                <label className="block text-xs font-medium mt-2">Assinatura 2 — Cargo</label>
                <input className="input" value={ev.sign2_role || ""} onChange={e => persist({ ...ev, sign2_role: e.target.value })} placeholder="Ex.: Secretária Municipal de Educação" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">A terceira assinatura (Participante) usa o nome do aluno no PDF.</p>
          </div>

          {/* Ações */}
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
            : "Nenhum aluno carregado ainda. Envie a planilha — exemplos são pré-carregados se este evento era novo ou com ?demo=1."}
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
                  <tr
                    key={i}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onDoubleClick={() => openEdit(i)}
                    title="Clique duas vezes para editar"
                  >
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

        <EditCertStudentModal
          open={editOpen}
          onOpenChange={(v) => (v ? setEditOpen(true) : closeEdit())}
          student={editingStudent as ModalStudent | null}
          index={editingIndex}
          onSave={handleSaveStudent}
          onDelete={handleDeleteStudent}
          onGenerateOne={handleGenerateOne}
        />
      </section>
    </main>
  );
}
